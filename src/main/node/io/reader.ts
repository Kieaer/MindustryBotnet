import Bytes from "./bytes";

export default class BufferReader {
    private readonly buffer: Buffer;
    private offset = 0;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    isEnd(): boolean {
        return this.offset >= this.buffer.length;
    }

    pos() {
        return this.offset;
    }

    read(bytes: number): Buffer {
        this.offset += bytes;
        return this.buffer.slice(this.offset - bytes, this.offset);
    }

    readBoolean(): boolean {
        return this.read(Bytes.boolean).readInt8() !== 0;
    }

    readByte(): number {
        return this.read(Bytes.byte).readInt8();
    }

    readShort(): number {
        return this.read(Bytes.short).readInt16BE();
    }

    readInt(): number {
        return this.read(Bytes.int).readIntBE(0, Bytes.int);
    }

    readLong(): bigint {
        return this.read(Bytes.long).readBigInt64BE();
    }

    readFloat(): number {
        return this.read(Bytes.float).readFloatBE();
    }

    readDouble(): number {
        return this.read(Bytes.double).readDoubleBE();
    }

    readBytes(length: number): Buffer {
        return this.read(length);
    }

    readString(): string | null {
        if (this.readByte() != 1) {
            return null;
        }
        return this.read(this.readShort()).toString("utf8");
    }

    readStringD(): string {
        return this.read(this.readShort()).toString("utf8");
    }
}
