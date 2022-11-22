import {BufferReader} from "./io";

export class ColorCodes {
    //public static flush = "\033[H\033[2J";
    public static reset = "\u001B[0m";
    public static bold = "\u001B[1m";
    public static italic = "\u001B[3m";
    public static underline = "\u001B[4m";
    public static black = "\u001B[30m";
    public static red = "\u001B[31m";
    public static green = "\u001B[32m";
    public static yellow = "\u001B[33m";
    public static blue = "\u001B[34m";
    public static purple = "\u001B[35m";
    public static cyan = "\u001B[36m";
    public static lightBlack = "\u001b[90m";
    public static lightRed = "\u001B[91m";
    public static lightGreen = "\u001B[92m";
    public static lightYellow = "\u001B[93m";
    public static lightBlue = "\u001B[94m";
    public static lightMagenta = "\u001B[95m";
    public static lightCyan = "\u001B[96m";
    public static lightWhite = "\u001b[97m";
    public static white = "\u001B[37m";

    public static backDefault = "\u001B[49m";
    public static backRed = "\u001B[41m";
    public static backGreen = "\u001B[42m";
    public static backYellow = "\u001B[43m";
    public static backBlue = "\u001B[44m";

    public static map: Map<string, string> = new Map();

    static {
        // map.put("ff", flush);
        ColorCodes.map.set("fr", ColorCodes.reset);
        ColorCodes.map.set("fb", ColorCodes.bold);
        ColorCodes.map.set("fi", ColorCodes.italic);
        ColorCodes.map.set("fu", ColorCodes.underline);
        ColorCodes.map.set("k", ColorCodes.black);
        ColorCodes.map.set("lk", ColorCodes.lightBlack);
        ColorCodes.map.set("lw", ColorCodes.lightWhite);
        ColorCodes.map.set("r", ColorCodes.red);
        ColorCodes.map.set("g", ColorCodes.green);
        ColorCodes.map.set("y", ColorCodes.yellow);
        ColorCodes.map.set("b", ColorCodes.blue);
        ColorCodes.map.set("p", ColorCodes.purple);
        ColorCodes.map.set("c", ColorCodes.cyan);
        ColorCodes.map.set("lr", ColorCodes.lightRed);
        ColorCodes.map.set("lg", ColorCodes.lightGreen);
        ColorCodes.map.set("ly", ColorCodes.lightYellow);
        ColorCodes.map.set("lm", ColorCodes.lightMagenta);
        ColorCodes.map.set("lb", ColorCodes.lightBlue);
        ColorCodes.map.set("lc", ColorCodes.lightCyan);
        ColorCodes.map.set("w", ColorCodes.white);
        ColorCodes.map.set("bd", ColorCodes.backDefault);
        ColorCodes.map.set("br", ColorCodes.backRed);
        ColorCodes.map.set("bg", ColorCodes.backGreen);
        ColorCodes.map.set("by", ColorCodes.backYellow);
        ColorCodes.map.set("bb", ColorCodes.backBlue);

    }
}


export enum LogLevel {
    debug,
    info,
    warn,
    err,
    none,
}

interface LogFormatter {
    format(text: string, useColors: boolean, ...args: any[]): string;
}

class DefaultLogFormatter implements LogFormatter {

    public static addColors(text: string): string {
        let finalText = text;
        for (const [k, v] of ColorCodes.map.entries()) {
            finalText = finalText.replace("&" + k, v);
        }
        return finalText;
    }

    public static removeColors(text: string): string {
        let finalText = text;
        for (const k of ColorCodes.map.keys()) {
            finalText = finalText.replace("&" + k, "");
        }
        return finalText;
    }

    public format(text: string, useColors: boolean, ...args: any[]): string {
        return useColors ? DefaultLogFormatter.addColors(text) : DefaultLogFormatter.removeColors(text);
    }
}

interface LogHandler {

    log(level: LogLevel, text: string, ...args: any[]): void;
}

class DefaultLogHandler implements LogHandler {
    public log(level: LogLevel, text: string, ...args: any[]) {
        let prefixColor;
        switch (level) {
            case LogLevel.debug:
                prefixColor = "&lc&fb";
                break;
            case LogLevel.info:
                prefixColor = "&fb";
                break;
            case LogLevel.warn:
                prefixColor = "&ly&fb";
                break;
            case LogLevel.err:
                prefixColor = "&lr&fb";
                break;
            case LogLevel.none:
                prefixColor = "";
                break;
        }

        console.log(Log.format(prefixColor + text + "&fr"), ...args);
    }
}

export class SuperLogHandler implements LogHandler {
    private static tags: string[] = ["&lc&fb[D]&fr", "&lb&fb[I]&fr", "&ly&fb[W]&fr", "&lr&fb[E]", ""];

    log(level: LogLevel, text: string, ...args: any[]) {
        if (level == LogLevel.err) text = text.replace(ColorCodes.reset, ColorCodes.lightRed + ColorCodes.bold);

        const date = new Date();
        const result = ColorCodes.bold + ColorCodes.lightBlack +
            "[" + date.toLocaleString() + "] " +
            ColorCodes.reset + Log.format(SuperLogHandler.tags[level] + " " + text + ColorCodes.reset);

        console.log(result, ...args);
    }
}

export class Log {
    public static level: LogLevel = LogLevel.info;
    public static logger: LogHandler = new DefaultLogHandler();
    public static formatter: LogFormatter = new DefaultLogFormatter();

    public static useColors: boolean = true;

    public static log(level: LogLevel, text: string, ...args: any[]): void {
        if (Log.level > level) {
            return;
        }

        this.logger.log(level, this.format(text), ...args);
    }

    public static debug(text: string, ...args: any[]) {
        this.log(LogLevel.debug, text, ...args);
    }

    public static infoTag(tag: string, text: string) {
        this.log(LogLevel.info, "[" + tag + "] " + text);
    }

    public static info(text: string, ...args: any[]) {
        this.log(LogLevel.info, text, ...args);
    }

    public static warn(text: string, ...args: any[]) {
        this.log(LogLevel.warn, text, ...args);
    }

    public static errTag(tag: string, text: string) {
        this.log(LogLevel.err, "[" + tag + "] " + text);
    }

    public static err(text: string, ...args: any[]) {
        this.log(LogLevel.err, text, ...args);
    }

    public static buffer(buffer: Buffer) {
        let b = "["
        let br = new BufferReader(buffer);
        while (!br.isEnd()) {
            b += br.readByte() + ",";
        }
        b += "]"
        this.info(b);
    }

    public static format(text: string, ...args: any[]) {
        return this.formatColors(text, true /* windows sucks */, ...args);
    }

    public static formatColors(text: string, useColors: boolean, ...args: any[]) {
        return this.formatter.format(text, useColors, ...args);
    }
}
