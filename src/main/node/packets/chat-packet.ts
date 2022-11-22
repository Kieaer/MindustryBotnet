import {BufferWriter, BufferReader} from "../io";
import {IdentifiedPacket} from "./packet";

export default class ChatMessagePacket implements IdentifiedPacket {
    public static ID = 69;

    constructor(message: string) {
        this.message = message;
    }

    public message: string;

    id(): number {
        return ChatMessagePacket.ID;
    }

    serialize(buf: BufferWriter) {
        buf.writeString(this.message)
    }

    deserialize(buf: BufferReader) {
        this.message = buf.readString();
    }
}