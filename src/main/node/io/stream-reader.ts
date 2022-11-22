import StreamBegin from "../packets/stream-begin";
import StreamChunk from "../packets/stream-chunk";
import PacketHandler from "../packets/packet-handler";
import {Log} from "../ultimate-logger";
import {BufferReader} from "./index";
import * as zlib from "zlib";

export default class StreamReader {
    public pid: number;
    public total: number;
    public type: number;

    public buf = Buffer.alloc(0);

    constructor(header: StreamBegin) {
        this.pid = header.pid;
        this.total = header.total;
        this.type = header.type;
    }

    add(sc: StreamChunk): string {
        this.buf = Buffer.concat([this.buf, sc.data])
        if (this.buf.length === this.total) {
            let p = new (PacketHandler.instance.idToPacket.get(this.type))();
            zlib.inflate(this.buf, (e, b) => {
                if (e) {
                    Log.err(e.toString())
                } else p.deserialize(new BufferReader(b))
            });
        }
        return Math.floor(this.buf.length / this.total * 100) + "% (" + Math.floor(this.buf.length / 512) + "/" + Math.floor(this.total / 512) + ") | [" + this.buf.length + "/" + this.total + "]";
    }
}
