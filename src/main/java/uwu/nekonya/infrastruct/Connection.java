package uwu.nekonya.infrastruct;

import arc.net.FrameworkMessage;
import arc.net.NetSerializer;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.net.SocketAddress;
import java.net.SocketException;
import java.nio.channels.SocketChannel;

public class Connection {
    private final Object listenerLock = new Object();
    int id = -1;
    TcpConnection tcp;
    UdpConnection udp;
    InetSocketAddress udpRemoteAddress;
    volatile boolean isConnected;
    private String name;
    private NetListener[] listeners = {};
    private int lastPingID;
    private long lastPingSendTime;

    protected Connection() {
    }

    void initialize(NetSerializer serialization, int writeBufferSize, int objectBufferSize) {
        tcp = new TcpConnection(serialization, writeBufferSize,
                objectBufferSize);
    }

    void setConnected(boolean isConnected) {
        this.isConnected = isConnected;
        if (isConnected && name == null)
            name = "Connection " + id;
    }

    public int sendTCP(Object object) {
        if (object == null) throw new IllegalArgumentException("object cannot be null.");

        try {
            return tcp.send(object);
        } catch (IOException e) {
            close(DcReason.error);
            return 0;
        }
    }

    public int sendUDP(Object object) {
        if (object == null)
            throw new IllegalArgumentException("object cannot be null.");
        SocketAddress address = udpRemoteAddress;
        if (address == null && udp != null)
            address = udp.connectedAddress;
        if (address == null && isConnected)
            throw new IllegalStateException("Connection is not connected via UDP.");

        try {
            if (address == null) throw new SocketException("Connection is closed.");

            return udp.send(object, address);
        } catch (IOException e) {
            close(DcReason.error);
            return 0;
        }
    }

    public void close(DcReason reason) {
        boolean wasConnected = isConnected;
        isConnected = false;
        tcp.close();
        if (udp != null && udp.connectedAddress != null)
            udp.close();
        if (wasConnected) {
            notifyDisconnected(reason);
        }
        setConnected(false);
    }

    public void addListener(NetListener listener) {
        if (listener == null)
            throw new IllegalArgumentException("listener cannot be null.");
        synchronized (listenerLock) {
            NetListener[] listeners = this.listeners;
            int n = listeners.length;
            for (int i = 0; i < n; i++)
                if (listener == listeners[i])
                    return;
            NetListener[] newListeners = new NetListener[n + 1];
            newListeners[0] = listener;
            System.arraycopy(listeners, 0, newListeners, 1, n);
            this.listeners = newListeners;
        }
    }

    void notifyConnected() {
        NetListener[] listeners = this.listeners;
        for (NetListener listener : listeners) {
            listener.connected(this);
        }
    }

    void notifyDisconnected(DcReason reason) {
        NetListener[] listeners = this.listeners;
        for (NetListener listener : listeners) {
            listener.disconnected(this, reason);
        }
    }

    void notifyIdle() {
        NetListener[] listeners = this.listeners;
        for (NetListener listener : listeners) {
            listener.idle(this);
            if (!isIdle())
                break;
        }
    }

    void notifyReceived(Object object) {
        if (object instanceof FrameworkMessage.Ping ping) {
            if (ping.isReply) {
                if (ping.id == lastPingID - 1) {
                    int returnTripTime = (int) (System.currentTimeMillis()
                            - lastPingSendTime);
                }
            } else {
                ping.isReply = true;
                sendTCP(ping);
            }
        }

        NetListener[] listeners = this.listeners;
        for (NetListener listener : listeners) {
            listener.received(this, object);
        }
    }

    public InetSocketAddress getRemoteAddressTCP() {
        SocketChannel socketChannel = tcp.socketChannel;
        if (socketChannel != null) {
            Socket socket = tcp.socketChannel.socket();
            if (socket != null) {
                return (InetSocketAddress) socket.getRemoteSocketAddress();
            }
        }
        return null;
    }

    public boolean isIdle() {
        return tcp.writeBuffer.position() / (float) tcp.writeBuffer.capacity() < tcp.idleThreshold;
    }

    public String toString() {
        if (name != null)
            return name;
        return "Connection " + id;
    }

}
