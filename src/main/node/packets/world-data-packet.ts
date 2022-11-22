import {BufferReader, BufferWriter} from "../io";
import {IdentifiedPacket} from "./packet";
import {Log} from "../ultimate-logger";

export default class WoldData implements IdentifiedPacket {
    public static ID = 2;

    public rules: string;
    public map: string;
    public wave: number;
    public wavetime: number;
    public tick: number;
    public seed0: bigint;
    public seed1: bigint;
    public pid: number;
    //TODO some hentai with maps
    id(): number {
        return WoldData.ID;
    }

    serialize(buf: BufferWriter) {
        //NOT PROVIDED
    }

    deserialize(buf: BufferReader) {
        this.rules = buf.readStringD();
        let size = buf.readShort();
        this.map = ""
        while (size > 1) {
            this.map += "[" + buf.readStringD() + ":" + buf.readStringD() + "]";
            size--;
        }
        this.wave = buf.readInt();
        this.wavetime = buf.readFloat();
        this.tick = buf.readDouble();
        this.seed0 = buf.readLong();
        this.seed1 = buf.readLong();
        this.pid = buf.readInt();
        Log.info("buffer", this)
    }
}
