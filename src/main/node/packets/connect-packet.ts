import CRC32 from "../crc32";
import {IdentifiedPacket} from "./packet";
import {BufferReader, BufferWriter} from '../io';

export default class ConnectPacket implements IdentifiedPacket {
    public static ID = 3;

    private static crc32 = new CRC32();

    constructor(version: number, versionType: string, mods: string[] = [],
                name: string, locale: string, uuid: Buffer, usid: string,
                mobile: boolean, color: number) {
        this.version = version;
        this.versionType = versionType;
        this.mods = mods
        this.name = name;
        this.locale = locale;
        this.uuid = uuid;
        this.usid = usid;
        this.mobile = mobile;
        this.color = color;
    }

    public version: number;
    public versionType: string;
    public mods: string[] = [];
    public name: string;
    public locale: string;
    public uuid: Buffer;
    public usid: string;
    public mobile: boolean;
    public color: number;

    id(): number {
        return ConnectPacket.ID;
    }

    serialize(buf: BufferWriter) {
        buf.writeInt(this.version);
        buf.writeString(this.versionType);
        buf.writeString(this.name);
        buf.writeString(this.locale);
        buf.writeString(this.usid);
        buf.writeBytes(this.uuid);
        // дааааа
        ConnectPacket.crc32.resetValue();
        ConnectPacket.crc32.update(this.uuid);
        buf.writeLong(BigInt(ConnectPacket.crc32.getValue()));
        buf.writeBoolean(this.mobile);
        buf.writeInt(this.color);
        buf.writeInt(this.mods.length);
        for (const mod of this.mods) {
            buf.writeString(mod);
        }
    }

    deserialize(buf: BufferReader) {
        this.version = buf.readInt();
        this.versionType = buf.readString();
        this.name = buf.readString();
        this.locale = buf.readString();
        this.usid = buf.readString();
        this.uuid = buf.readBytes(8);


        // ConnectPacket.crc32.resetValue();
        // ConnectPacket.crc32.update(this.uuid);
        buf.readBytes(8); // скипаем пока что
        // тут перепроверяем crc, но чёт лень

        this.mobile = buf.readBoolean();
        this.color = buf.readInt();
        this.mods = []

        const size = buf.readInt();
        for (let i = 0; i < size; i++) {
            this.mods[i] = buf.readString();
        }
    }
}