import Bytes from "./bytes";

export default class BufferWriter {
    private readonly buffer: Buffer;
    private offset = 0;

    constructor(buffer: Buffer) {
        this.buffer = buffer;
    }

    writeBoolean(bool: boolean): void {
        this.buffer.writeInt8(bool ? 1 : 0, this.offset);
        this.offset += Bytes.boolean;
    }

    writeByte(byte: number): void {
        this.buffer.writeInt8(byte, this.offset);
        this.offset += Bytes.byte;
    }

    writeShort(short: number): void {
        this.buffer.writeInt16BE(short, this.offset);
        this.offset += Bytes.short;
    }

    writeInt(int: number): void {
        this.buffer.writeIntBE(int, this.offset, Bytes.int);
        this.offset += Bytes.int;
    }

    writeLong(long: bigint): void {
        this.buffer.writeBigInt64BE(long, this.offset);
        this.offset += Bytes.long;
    }

    writeFloat(float: number): void {
        this.buffer.writeFloatBE(float, this.offset);
        this.offset += Bytes.float;
    }

    writeDouble(double: number): void {
        this.buffer.writeDoubleBE(double, this.offset);
        this.offset += Bytes.double;
    }

    // У Анюка тоже есть тупо запись массива
    writeBytes(buf: Buffer, offset = 0, length = buf.length): void {
        buf.copy(this.buffer, this.offset, offset, length);
        this.offset += length;
    }

    writeString(string: string | null, length: number = string ? string.length : 0): void {
        if (string === null) { // а чё ругается то
            this.writeByte(0);
        } else {
            this.writeByte(1);
            this.writeShort(length);
            this.buffer.write(string, this.offset);
            this.offset += length;
        }
    }

    writeStringScum(string: string | null, length: number = string ? string.length : 0): void {
        if (string === null) { // а чё ругается то
            this.writeByte(0);
        } else {
            this.writeByte(1);
            this.writeShort(length - 1);
            this.buffer.write(string, this.offset);
            this.offset += length - 1;
        }
    }

    bytesWritten(): number {
        return this.offset;
    }
}
