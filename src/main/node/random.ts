function nextByte(): number {
    // надежно, я атвичаю
    return (Math.random() * 127) + 1;
}

// в  р  е  м я   те с  т  о в
export function randomNekoNya(length: number): Buffer {
    const buf = Buffer.alloc(length);

    for (let i = 0; i < buf.length; i++) {
        buf[i] = nextByte();
    }

    return buf;
}
