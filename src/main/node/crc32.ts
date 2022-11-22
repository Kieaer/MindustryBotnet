export default class CRC32 {
    private static table: number[] = [];

    static {
        for (let i = 0; i < 256; i++) {
            let r = i;
            // надо было писать на плюсах кстати, веселей возможно было
            for (let j = 0; j < 8; j++) {
                if ((r & 1) != 0) {
                    r = (r >>> 1) ^ 0xEDB88320
                } else {
                    r >>>= 1;
                }
            }
            CRC32.table[i] = r;
        }
    }

    private value = -1;

    public update(buf: Buffer, offset = 0, length = buf.length) {
        for (let i = 0; i < length; i++) {
            this.value = CRC32.table[(this.value ^ buf[offset + i]) & 0xFF] ^ (this.value >>> 8);
        }
    }

    public getValue(): number {
        return ~this.value; // реализация явно неправильная, не должно быть такого, пойду нативную искать
    }

    public resetValue(): void {
        this.value = -1
    }

    // Теперь остаётся один вопрос
    // Почему этот CRC32 находится в арке, но не юзается
    // А как раз таки юзается jdkшный
    // Не потому что оно может быть сломано? :)
}