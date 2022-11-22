import {BufferWriter, BufferReader} from "../io";
import {IdentifiedPacket} from "./packet";

export default class MessagePacket implements IdentifiedPacket {
    public static ID = 70;

    public message: string;

    id(): number {
        return MessagePacket.ID;
    }

    serialize(buf: BufferWriter) {
        buf.writeString(this.message);
    }

    deserialize(buf: BufferReader) {
        this.message = buf.readString();
    }
}