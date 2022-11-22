import {IdentifiedPacket, Packet} from "./packet";
import {BufferReader, BufferWriter} from "../io";

export default class RegisterUDPPacket implements IdentifiedPacket {

    public static ID = 3;

    constructor(connectionID: number) {
        this.connectionID = connectionID;
    }

    private connectionID: number;

    id(): number {
        return RegisterUDPPacket.ID;
    }

    serialize(buf: BufferWriter) {
        buf.writeByte(-2)
        buf.writeByte(this.id());
        buf.writeInt(this.connectionID);
    }

    deserialize(buf: BufferReader) {
        this.connectionID = buf.readInt();
    }
}