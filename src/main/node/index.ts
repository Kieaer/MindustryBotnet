import {Log, LogLevel, SuperLogHandler} from './ultimate-logger';
import PacketHandler from "./packets/packet-handler";
import MessagePacket from "./packets/message-packet";
import MessagePacket2 from "./packets/message-packet2";
import ChatEntity from "./chat-entity";
import WorldData from "./packets/world-data-packet";
import StreamBegin from "./packets/stream-begin";
import StreamChunk from "./packets/stream-chunk";

Log.level = LogLevel.debug;
Log.logger = new SuperLogHandler();

PacketHandler.instance.on(70, (packet: MessagePacket) => Log.info("SMP1|>|", packet));
PacketHandler.instance.on(71, (packet: MessagePacket2) => Log.info("SMP2|>|", packet));
PacketHandler.instance.on(2, (packet: WorldData) => Log.info("WD|>|", packet));

PacketHandler.instance.on(0, (packet: StreamBegin) => {
    Log.info("STREAM BEGIN|<" + packet.pid + ">|", packet.type, packet.total);
    PacketHandler.instance.runChunks(packet)
});

PacketHandler.instance.on(1, (packet: StreamChunk) => {
    Log.info("STREAM CHUNK|<" + packet.pid + ">|", PacketHandler.instance.pushChunk(packet));
});

// const en = new ChatEntity("darkdustry.tk",6567,"neko-test-nya", false);
const en = new ChatEntity("127.0.0.1", 6567, "neko-test-nya", false);
//setTimeout(() => en.sendMessage("/sync"), 3000)
setTimeout(() => {
    while (true) en.sendRuntime()
}, 3000)
