import {BufferReader, BufferWriter} from "../io";
import {IdentifiedPacket, Packet} from "./packet";
import {Log} from "../ultimate-logger";
import ConnectPacket from "./connect-packet";
import SendMessagePacket from "./message-packet";
import SendMessagePacket2 from "./message-packet2";
import WoldData from "./world-data-packet";
import StreamBegin from "./stream-begin";
import StreamChunk from "./stream-chunk";
import StreamReader from "../io/stream-reader";

// звучит странно, но теоретически работает
interface Class<T> {
    new(...args: any[]): T;
}

export default class PacketHandler {
    public static instance = new PacketHandler();
    public idToPacket: Map<number, Class<Packet>> = new Map();
    private packetToId: Map<Class<Packet>, number> = new Map();
    private handlers: Map<number, Function> = new Map();
    private streamsOnline: StreamReader[] = [];

    private lastBuf: Buffer = Buffer.alloc(0);

    static {
        PacketHandler.instance.register(ConnectPacket, ConnectPacket.ID); // в общем так
        PacketHandler.instance.register(SendMessagePacket, SendMessagePacket.ID);
        PacketHandler.instance.register(SendMessagePacket2, SendMessagePacket2.ID);
        PacketHandler.instance.register(WoldData, WoldData.ID);
        PacketHandler.instance.register(StreamBegin, StreamBegin.ID);
        PacketHandler.instance.register(StreamChunk, StreamChunk.ID);
    }

    on<T extends Packet>(id: number, on: (packet: T) => any): void {
        this.handlers.set(id, on);
    }

    register<T extends Packet>(type: Class<T>, id: number): void {
        this.packetToId.set(type, id);
        this.idToPacket.set(id, type);
    }

    runChunks(starter: StreamBegin) {
        this.streamsOnline[starter.pid] = new StreamReader(starter);
    }

    pushChunk(chunk: StreamChunk) {
        try {
            return (this.streamsOnline[chunk.pid].add(chunk));
        } catch (e) {
            Log.err(e.toString());
            Log.err("Чанк без инициализации")
            return -1;
        }
    }

    handle(buffer: Buffer): Packet {
        buffer = Buffer.concat([this.lastBuf, buffer]);
        //TODO врезать сюды
        let br = new BufferReader(buffer);
        let i = 0;
        while (true) {
            i++
            let p_size = br.readShort();//длинна
            let br_entry = br.pos();
            if (p_size > buffer.length - br_entry) {
                Log.err("OOB > ", i, p_size, buffer.length - br_entry)
                let b = Buffer.alloc(2)
                let bw = new BufferWriter(b);
                bw.writeShort(p_size);
                if (buffer.length - br_entry !== 0) {
                    this.lastBuf = Buffer.concat([b, buffer.subarray(br.pos())])
                } else {
                    this.lastBuf = Buffer.alloc(0);
                }
                return;
            }
            const packetId = br.readByte();//ид пакета 1
            if (packetId === -2) {
                return;
            }
            br.read(2);//хрень няхой ее //2+1
            if (br.readByte() === 1) {
                br.read(2);
                p_size -= 2;
            }


            const packetType = this.idToPacket.get(packetId);
            if (packetType) {
                const packet = new packetType(); // вот так
                packet.deserialize(br);

                const handler = this.handlers.get(packetId);
                if (handler) {
                    handler(packet);
                }

            } else {
                Log.err('чё за пакет няхой?', packetId)
                if (!br.isEnd()) {
                    br.read(p_size - (br.pos() - br_entry));
                }
                if (br.isEnd()) {
                    return;
                }
            }
            if (!br.isEnd()) {
                br.read(p_size - (br.pos() - br_entry));
            }
            if (br.isEnd()) {
                return;
            }
        }
    }

    preSend(packet: IdentifiedPacket, minus: number = 0): Buffer {
        let buffer = Buffer.alloc(8120);
        let bw = new BufferWriter(buffer)

        packet.serialize(bw);
        buffer = buffer.subarray(0, bw.bytesWritten())

        const plus = buffer.length < 15 ? 6 : 8;

        let b = Buffer.alloc(buffer.length + plus);
        b.writeInt16BE(buffer.length + plus - 2 - minus, 0);
        b[2] = packet.id();
        b[3] = 0;
        b[4] = buffer.length;
        let i = 4;
        if (buffer.length < 15) {
            b[++i] = 0
        } else {
            b[++i] = 1;
            b[++i] = 240;
            b[++i] = buffer.length - 15;
        }
        buffer.copy(b, ++i, 0)

        return b;
    }
}
