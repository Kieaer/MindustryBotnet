import {IdentifiedPacket} from "./packet";
import {BufferReader, BufferWriter} from "../io";

export default class StreamChunk implements IdentifiedPacket {
    public static ID = 1;

    public pid: number;
    public data: Buffer;

    //TODO some hentai with maps
    id(): number {
        return StreamChunk.ID;
    }

    serialize(buf: BufferWriter) {
        //NOT PROVIDED
    }

    deserialize(buf: BufferReader) {
        this.pid = buf.readInt();
        this.data = buf.readBytes(buf.readShort());
    }
}
