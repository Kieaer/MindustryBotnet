import {BufferReader, BufferWriter} from "../io";
import {IdentifiedPacket} from "./packet";

export default class ChatMessageScumPacket implements IdentifiedPacket {
    public static ID = 69;


    public message: string;

    id(): number {
        return ChatMessageScumPacket.ID;
    }

    serialize(buf: BufferWriter) {
        buf.writeStringScum("ﻻ")
    }

    deserialize(buf: BufferReader) {
        this.message = buf.readString();
    }
}
