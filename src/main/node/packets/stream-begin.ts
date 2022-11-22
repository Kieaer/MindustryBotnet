import {IdentifiedPacket} from "./packet";
import {BufferReader, BufferWriter} from "../io";

export default class StreamBegin implements IdentifiedPacket {
    public static ID = 0;

    public pid: number;
    public total: number;
    public type: number;

    //TODO some hentai with maps
    id(): number {
        return StreamBegin.ID;
    }

    serialize(buf: BufferWriter) {
        //NOT PROVIDED
    }

    deserialize(buf: BufferReader) {
        this.pid = buf.readInt()
        this.total = buf.readInt()
        this.type = buf.readByte()
    }
}
