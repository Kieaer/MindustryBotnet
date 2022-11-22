import * as net from 'net'
import * as dgram from 'dgram'
import {Log} from "./ultimate-logger";
import PacketHandler from "./packets/packet-handler";
import ChatMessagePacket from "./packets/chat-packet";
import RegisterUDPPacket from "./packets/register-upd-packet";
import {BufferWriter} from "./io";
import ConnectPacket from "./packets/connect-packet";
import UUID from "./uuid";
import Bind from './bind';
import ChatMessageScumPacket from "./packets/chat-packet-scum";

export default class ChatEntity {

    public readonly udp : dgram.Socket;
    private tcp : net.Socket;
    private host : string;
    private port : number;
    private playername : string;
    private hidden : boolean;

    constructor(ip: string, port: number, username: string, hidden: boolean) {
        this.hidden = hidden;
        this.playername = username;
        this.host = ip;
        this.port = port;
        this.hidden = hidden;
        this.udp = dgram.createSocket('udp4');
        this.tcp = net.createConnection(port, ip, () => {
            this.tcp.on("data", this.listener)
        });
    }

    @Bind
    defaultListener(e: Buffer) {
        Log.err(">", e)
        PacketHandler.instance.handle(e);
    }

    @Bind
    listener(e: Buffer) {
        if (e.at(2) === 254 && e.at(3) === 4) {
            Log.err("", this.constructor.name)
            //Log.err("",this)
            let confirmUDPpacket = new RegisterUDPPacket(e.readInt32BE(4));
            this.udp.connect(this.port, this.host, () => {
                Log.info("udp|>|", confirmUDPpacket)
                let b = Buffer.alloc(6)
                confirmUDPpacket.serialize(new BufferWriter(b))
                this.udp.send(b)
            })

            this.tcp.on("data", this.defaultListener);
            this.udp.on("data", this.defaultListener);
            this.tcp.removeListener("data", this.listener)

            const p = PacketHandler.instance;

            setTimeout(() => {
                this.tcp.write(p.preSend(new ConnectPacket(137, "official", [], this.playername, "ru", new UUID().getUUID(), new UUID().getUSID(), false, 277353)), () => {
                    if (!this.hidden) {
                        this.tcp.write(Buffer.from([0, 4, 23, 0, 0, 0]), () => {
                            setInterval(() => this.tcp.write(Buffer.from([0, 2, -2, 2])), 5000)
                        })
                    } else {
                        setInterval(() => this.tcp.write(Buffer.from([0, 2, -2, 2])), 5000)
                    }
                })
            }, 1000);
        }
    }

    sendMessage(message: string) {
        if (this.hidden) return;
        this.tcp.write(PacketHandler.instance.preSend(new ChatMessagePacket(message)))
    }

    sendRuntime() {
        if (this.hidden) return;
        this.tcp.write(PacketHandler.instance.preSend(new ChatMessageScumPacket()))
    }
}
