package uwu.nekonya;

import arc.struct.Seq;
import arc.util.Log;
import arc.util.Threads;
import mindustry.core.Version;
import mindustry.gen.ConnectConfirmCallPacket;
import mindustry.gen.SendChatMessageCallPacket;
import mindustry.gen.SendMessageCallPacket;
import mindustry.gen.SendMessageCallPacket2;
import mindustry.net.ArcNetProvider;
import mindustry.net.Packet;
import mindustry.net.Packets;
import uwu.nekonya.infrastruct.Client;
import uwu.nekonya.infrastruct.Connection;
import uwu.nekonya.infrastruct.NetListener;

import java.util.Random;

import static uwu.nekonya.Main.usid;
import static uwu.nekonya.Main.uuid;

public class ChatEntity {
    private static final SendChatMessageCallPacket msgPacket = new SendChatMessageCallPacket();
    private final Client client;
    private final String playername;
    private final boolean hidden;

    public ChatEntity(String ip, int port, String username, boolean hidden) {
        Version.build = 140;

        this.playername = username;
        this.hidden = hidden;
        client = new Client(8192, 8192, new ArcNetProvider.PacketSerializer());
        client.addListener(new NetListener() {
            @Override
            public void connected(Connection connection) {
                Log.info("<CONNECTED>");
                if (connection.getRemoteAddressTCP().getAddress().getHostAddress() != null)
                    Log.info("<Connecting to server: @>", connection.getRemoteAddressTCP().getAddress().getHostAddress());
                Packets.ConnectPacket packet = new Packets.ConnectPacket();
                packet.name = playername;
                packet.locale = "ru";
                packet.mods = new Seq<>();
                packet.mobile = false;
                packet.versionType = "official";
                packet.color = new Random().nextInt(999999);
                packet.usid = usid();
                packet.uuid = uuid();
                ConnectConfirmCallPacket packet2 = new ConnectConfirmCallPacket();

                Log.info("<Connect> " + (client.sendTCP(packet) != 0));
                if (!hidden)
                    Log.info("<Confirm> " + (client.sendTCP(packet2) != 0));
            }

            @Override
            public void received(Connection connection, Object object) {

                if (!(object instanceof Packet mh)) return;

                if (mh instanceof SendMessageCallPacket2 sm) {
                    try {
                        sm.handled();
                    } catch (Exception ignored) {
                    }
                    return;
                }

                if (mh instanceof SendMessageCallPacket sm) {
                    try {
                        sm.handled();
                    } catch (Exception ignored) {
                    }
                    Log.info(sm.message);
                    return;
                }

                if (mh instanceof SendChatMessageCallPacket sm) {
                    try {
                        sm.handled();
                    } catch (Exception ignored) {
                    }
                    Log.info(sm.message);
                }
            }
        });
        try {
            Threads.daemon("CLIENT #" + playername, () -> {
                try {
                    client.run();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
            client.connect(5000, ip, port, port);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void sendChatMessage(String message) {
        if (hidden) {
            return;
        }
        msgPacket.message = message;
        client.sendTCP(msgPacket);
    }

    public void disconnect() {
        try {
            client.reconnect();
        } catch (Exception ignored) {
        }
        client.stop();
    }
}
