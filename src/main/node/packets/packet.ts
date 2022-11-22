import {BufferReader, BufferWriter} from '../io';

export interface Packet {

    serialize(buf: BufferWriter): void;

    deserialize(buf: BufferReader): void;
}

export interface IdentifiedPacket extends Packet {

    id(): number;
}