package uwu.nekonya.infrastruct;

import java.util.Random;

public class Coders {
    protected static Random random = new Random();
    protected static CharMap map = new CharMap('+', '/');

    public static void nextBytes(final byte[] bytes) {
        int n;
        int i = bytes.length;
        while (i != 0) {
            n = Math.min(i, 8);
            // а откуда это?
            for (long bits = random.nextLong(); n-- != 0; bits >>= 8)
                bytes[--i] = (byte) bits;

            // в js нет нормального рандома, есть только рандом от 0 до 1, (Math.random())
            // в плане нет множества удобных методов
            // есть, много причём
            // в 17 так точно
        }
    }

    public static char[] encode(byte[] in) {
        char[] charMap = map.getEncodingMap();
        int iLen = in.length;
        int oDataLen = (iLen * 4 + 2) / 3; // output length without padding
        int oLen = ((iLen + 2) / 3) * 4; // output length including padding
        char[] out = new char[oLen];
        int ip = 0;
        int op = 0;
        while (ip < iLen) {
            int i0 = in[ip++] & 0xff;
            int i1 = ip < iLen ? in[ip++] & 0xff : 0;
            int i2 = ip < iLen ? in[ip++] & 0xff : 0;
            int o0 = i0 >>> 2;
            int o1 = ((i0 & 3) << 4) | (i1 >>> 4);
            int o2 = ((i1 & 0xf) << 2) | (i2 >>> 6);
            int o3 = i2 & 0x3F;
            out[op++] = charMap[o0];
            out[op++] = charMap[o1];
            out[op] = op < oDataLen ? charMap[o2] : '=';
            op++;
            out[op] = op < oDataLen ? charMap[o3] : '=';
            op++;
        }
        return out;
    }

    public static class CharMap {
        protected final char[] encodingMap = new char[64];
        protected final byte[] decodingMap = new byte[128];

        public CharMap(char char63, char char64) {
            int i = 0;
            for (char c = 'A'; c <= 'Z'; c++) {
                encodingMap[i++] = c;
            }
            for (char c = 'a'; c <= 'z'; c++) {
                encodingMap[i++] = c;
            }
            for (char c = '0'; c <= '9'; c++) {
                encodingMap[i++] = c;
            }
            encodingMap[i++] = char63;
            encodingMap[i++] = char64;
            for (i = 0; i < decodingMap.length; i++) {
                decodingMap[i] = -1;
            }
            for (i = 0; i < 64; i++) {
                decodingMap[encodingMap[i]] = (byte) i;
            }
        }

        public byte[] getDecodingMap() {
            return decodingMap;
        }

        public char[] getEncodingMap() {
            return encodingMap;
        }
    }
}
