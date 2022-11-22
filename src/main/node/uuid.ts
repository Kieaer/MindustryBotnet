import {randomNekoNya} from './random'
import CRC from "./crc32";

export default class UUID {

    private readonly buffer: Buffer;

    constructor() {
        const crc = new CRC();
        let i = 1;
        do {
            crc.resetValue();
            this.buffer = UUID.get();
            crc.update(this.buffer);
            i++;
        } while (crc.getValue() < 1);
    }

    static get() {
        return randomNekoNya(8);
    }

    getUUID() {
        return this.buffer;
    }

    getUSID() {
        return this.buffer.toString('base64url');
    }
}