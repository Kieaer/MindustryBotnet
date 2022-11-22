package uwu.nekonya.infrastruct;

import arc.net.FrameworkMessage;
import arc.net.NetSerializer;

import java.io.IOException;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.SocketTimeoutException;
import java.nio.channels.CancelledKeyException;
import java.nio.channels.SelectionKey;
import java.nio.channels.Selector;
import java.util.Iterator;
import java.util.Set;

public class Client extends Connection implements Runnable {
    private final NetSerializer serialization;
    private final Object updateLock = new Object();
    private final Selector selector;
    private final Object tcpRegistrationLock = new Object();
    private final Object udpRegistrationLock = new Object();
    private int emptySelects;
    private volatile boolean tcpRegistered, udpRegistered;
    private volatile boolean shutdown;
    private Thread updateThread;
    private int connectTimeout;
    private InetAddress connectHost;
    private int connectTcpPort;
    private int connectUdpPort;
    private boolean isClosed;

    public Client(int writeBufferSize, int objectBufferSize, NetSerializer serialization) {
        this.serialization = serialization;

        initialize(serialization, writeBufferSize, objectBufferSize);

        try {
            selector = Selector.open();
        } catch (IOException ex) {
            throw new RuntimeException("Error opening selector.", ex);
        }
    }

    public void connect(int timeout, String host, int tcpPort, int udpPort) throws IOException {
        connect(timeout, InetAddress.getByName(host), tcpPort, udpPort);
    }

    public void connect(int timeout, InetAddress host, int tcpPort, int udpPort) throws IOException {
        if (host == null)
            throw new IllegalArgumentException("host cannot be null.");
        if (Thread.currentThread() == getUpdateThread())
            throw new IllegalStateException(
                    "Cannot connect on the connection's update thread.");
        this.connectTimeout = timeout;
        this.connectHost = host;
        this.connectTcpPort = tcpPort;
        this.connectUdpPort = udpPort;
        close();
        id = -1;
        try {
            if (udpPort != -1)
                udp = new UdpConnection(serialization,
                        tcp.readBuffer.capacity());

            long endTime;
            synchronized (updateLock) {
                tcpRegistered = false;
                selector.wakeup();
                endTime = System.currentTimeMillis() + timeout;
                tcp.connect(selector, new InetSocketAddress(host, tcpPort),
                        5000);
            }

            // Wait for RegisterTCP.
            synchronized (tcpRegistrationLock) {
                while (!tcpRegistered && System.currentTimeMillis() < endTime) {
                    try {
                        tcpRegistrationLock.wait(100);
                    } catch (InterruptedException ignored) {
                    }
                }
                if (!tcpRegistered) {
                    throw new SocketTimeoutException(
                            "Connected, but timed out during TCP registration.\n"
                                    + "Note: Client#update must be called in a separate thread during connect.");
                }
            }

            if (udpPort != -1) {
                InetSocketAddress udpAddress = new InetSocketAddress(host,
                        udpPort);
                synchronized (updateLock) {
                    udpRegistered = false;
                    selector.wakeup();
                    udp.connect(selector, udpAddress);
                }

                // Wait for RegisterUDP reply.
                synchronized (udpRegistrationLock) {
                    while (!udpRegistered
                            && System.currentTimeMillis() < endTime) {
                        FrameworkMessage.RegisterUDP registerUDP = new FrameworkMessage.RegisterUDP();
                        registerUDP.connectionID = id;
                        udp.send(registerUDP, udpAddress);
                        try {
                            udpRegistrationLock.wait(100);
                        } catch (InterruptedException ignored) {
                        }
                    }
                    if (!udpRegistered)
                        throw new SocketTimeoutException(
                                "Connected, but timed out during UDP registration: "
                                        + host + ":" + udpPort);
                }
            }
        } catch (IOException ex) {
            close();
            throw ex;
        }
    }

    public void reconnect() throws IOException {
        reconnect(connectTimeout);
    }

    public void reconnect(int timeout) throws IOException {
        if (connectHost == null)
            throw new IllegalStateException(
                    "This client has never been connected.");
        connect(timeout, connectHost, connectTcpPort, connectUdpPort);
    }

    public void update(int timeout) throws IOException {
        updateThread = Thread.currentThread();
        synchronized (updateLock) { // Blocks to avoid a select while the
            // selector is used to bind the server
            // connection.
        }
        long startTime = System.currentTimeMillis();
        int select = 0;
        if (timeout > 0) {
            select = selector.select(timeout);
        } else {
            select = selector.selectNow();
        }
        if (select == 0) {
            emptySelects++;
            if (emptySelects == 100) {
                emptySelects = 0;
                // NIO freaks and returns immediately with 0 sometimes, so try
                // to keep from hogging the CPU.
                long elapsedTime = System.currentTimeMillis() - startTime;
                try {
                    if (elapsedTime < 25)
                        Thread.sleep(25 - elapsedTime);
                } catch (InterruptedException ignored) {
                }
            }
        } else {
            emptySelects = 0;
            isClosed = false;
            Set<SelectionKey> keys = selector.selectedKeys();
            synchronized (keys) {
                for (Iterator<SelectionKey> iter = keys.iterator(); iter.hasNext(); ) {
                    keepAlive();
                    SelectionKey selectionKey = iter.next();
                    iter.remove();
                    try {
                        int ops = selectionKey.readyOps();
                        if ((ops & SelectionKey.OP_READ) == SelectionKey.OP_READ) {
                            if (selectionKey.attachment() == tcp) {
                                while (true) {
                                    Object object = tcp.readObject();
                                    if (object == null)
                                        break;
                                    if (!tcpRegistered) {
                                        if (object instanceof FrameworkMessage.RegisterTCP) {
                                            id = ((FrameworkMessage.RegisterTCP) object).connectionID;
                                            synchronized (tcpRegistrationLock) {
                                                tcpRegistered = true;
                                                tcpRegistrationLock.notifyAll();
                                                if (udp == null)
                                                    setConnected(true);
                                            }
                                            if (udp == null)
                                                notifyConnected();
                                        }
                                        continue;
                                    }
                                    if (udp != null && !udpRegistered) {
                                        if (object instanceof FrameworkMessage.RegisterUDP) {
                                            synchronized (udpRegistrationLock) {
                                                udpRegistered = true;
                                                udpRegistrationLock.notifyAll();
                                                setConnected(true);
                                            }
                                            notifyConnected();
                                        }
                                        continue;
                                    }
                                    if (!isConnected)
                                        continue;
                                    notifyReceived(object);
                                }
                            } else {
                                if (udp.readFromAddress() == null)
                                    continue;
                                Object object = udp.readObject();
                                if (object == null)
                                    continue;
                                notifyReceived(object);
                            }
                        }
                        if ((ops & SelectionKey.OP_WRITE) == SelectionKey.OP_WRITE)
                            tcp.writeOperation();
                    } catch (CancelledKeyException ignored) {
                        // Connection is closed.
                    }
                }
            }
        }
        if (isConnected) {
            long time = System.currentTimeMillis();
            if (tcp.isTimedOut(time)) {
                close();
            } else
                keepAlive();
            if (isIdle())
                notifyIdle();
        }
    }

    void keepAlive() {
        if (!isConnected) return;
        long time = System.currentTimeMillis();
        if (tcp.needsKeepAlive(time)) sendTCP(FrameworkMessage.keepAlive);
        if (udp != null && udpRegistered && udp.needsKeepAlive(time)) sendUDP(FrameworkMessage.keepAlive);
    }

    public void run() {
        shutdown = false;
        while (!shutdown) {
            try {
                update(250);
            } catch (IOException ex) {
                close();
            }
        }
    }


    public void stop() {
        if (shutdown)
            return;
        close();
        shutdown = true;
        selector.wakeup();
    }

    public void close() {
        super.close(DcReason.closed);
        synchronized (updateLock) { // Blocks to avoid a select while the
            // selector is used to bind the server
            // connection.
        }
        // Select one last time to complete closing the socket.
        if (!isClosed) {
            isClosed = true;
            selector.wakeup();
        }
    }

    public Thread getUpdateThread() {
        return updateThread;
    }

}