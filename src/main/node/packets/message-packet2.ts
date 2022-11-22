import {IdentifiedPacket} from "./packet";
import {BufferReader, BufferWriter} from "../io";

export default class MessagePacket2 implements IdentifiedPacket {
    public static ID = 71;

    public message: string;

    id(): number {
        return MessagePacket2.ID;
    }

    serialize(buf: BufferWriter) {
    }

    deserialize(buf: BufferReader) {
        this.message = buf.readString();
    }

}