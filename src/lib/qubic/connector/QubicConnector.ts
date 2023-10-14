import { ReceivedPackage } from "../packages/ReceivedPackage";
import { RequestResponseHeader } from "../packages/RequestResponseHeader";
import * as net from 'net';


export class QubicConnector {

    private PORT = 21841;

    /* bridged browser part */
    private webSocket;
    private isWsConnected = false;

    private socket: net.Socket | undefined;

    private peerConnected = false;
    private connectedPeerAddress: string | undefined; // the peer we are connected to
    private buffer: Uint8Array = new Uint8Array(4 * 1024 * 1024);
    private bufferWritePosition: number = 0;
    private bufferReadPosition: number = 0;

    private isElectron: boolean = false;

    public onReady?: () => void
    public onWsDisconnected?: () => void
    public onPeerConnected?: () => void
    public onPeerDisconnected?: () => void
    public onPackageReceived?: (packet: ReceivedPackage) => void


    constructor() {
        this.isElectron = this.isElectronCheck();
        if (!this.isElectron) {
            this.webSocket = new WebSocket('wss://1.b.qubic.li/'); // qli web bridge address
        } else {
            if (window.require) {
                const net2 = window.require("net")
                this.socket = new net2.Socket();
                if (this.socket) {
                    this.socket.on('data', (d: any) => {
                        this.writeBuffer(d);
                    });
                    this.socket.on('close', (d: any) => {
                        if (this.onPeerDisconnected)
                            this.onPeerDisconnected();
                    });
                }
            }
        }
    }
    private isElectronCheck(): boolean {
        // Renderer process
        if (typeof window !== 'undefined' && typeof window.process === 'object' && (<any>window.process).type === 'renderer') {
            return true;
        }

        // Main process
        if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!(<any>process.versions).electron) {
            return true;
        }

        // Detect the user agent when the `nodeIntegration` option is set to true
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            return true;
        }

        return false;
    }

    private onPeerConnect() {
        this.peerConnected = true;
        if (this.onPeerConnected)
            this.onPeerConnected();
    }
    private toBase64(u8: any): string {
        return btoa(String.fromCharCode.apply(null, u8));
    }

    private connectPeer(ipAddress: string): boolean {
        if (!this.isElectron) {
            if (!this.isWsConnected) {
                console.error("WS not connected")
                return false;
            }
            this.webSocket?.send(JSON.stringify(
                {
                    command: 'connect',
                    host: ipAddress,
                    port: this.PORT
                }
            ));
        } else {
            this.socket?.connect(this.PORT, ipAddress, () => {
                this.onPeerConnect();
            });
        }
        this.connectedPeerAddress = ipAddress;
        return true;
    }
    private disconnectPeer(): void {
        if (this.connectedPeerAddress) {
            if (!this.isElectron) {
                this.webSocket?.send(JSON.stringify(
                    {
                        command: 'disconnect',
                        host: this.connectedPeerAddress,
                        port: this.PORT
                    }
                ));
            } else {
                this.socket?.destroy();
            }
            this.connectedPeerAddress = undefined;
            this.peerConnected = false;
        }
    }

    private reconnectPeer(): boolean {
        this.disconnectPeer(); // disconnect
        if (this.connectedPeerAddress) {
            return this.connectPeer(this.connectedPeerAddress); // conncet
        }
        return false;
    }

    private writeBuffer(data: Uint8Array) {
        //console.log("writeBuffer", data);
        let writeLength = data.length;
        if (this.bufferWritePosition + data.length > this.buffer.length)
            writeLength = this.buffer.length - this.bufferWritePosition;

        this.buffer.set(data.slice(0, writeLength), this.bufferWritePosition);
        this.bufferWritePosition += writeLength;

        if (writeLength < data.length) {
            this.bufferWritePosition = 0;
            this.buffer.set(data.slice(writeLength, data.length))
            this.bufferWritePosition += data.length - writeLength;
        }

        this.processBuffer();
    }

    private readFromBuffer(numberOfBytes: number, setReadPosition: boolean = false): Uint8Array {

        const extract = new Uint8Array(numberOfBytes);
        if (this.bufferReadPosition + numberOfBytes <= this.buffer.length) {
            const readBytes = this.buffer.slice(this.bufferReadPosition, this.bufferReadPosition + numberOfBytes);
            //console.log("BUFFER READ " + this.bufferReadPosition + " - " + numberOfBytes, readBytes);
            extract.set(readBytes);
        }
        else {
            extract.set(this.buffer.slice(this.bufferReadPosition));
            extract.set(this.buffer.slice(0, this.bufferReadPosition + numberOfBytes - this.buffer.length));
        }
        if (setReadPosition)
            this.setReadPosition(numberOfBytes);

        return extract;
    }

    private setReadPosition(numberOfReadByts: number) {
        if (this.bufferReadPosition + numberOfReadByts > this.buffer.length)
            this.bufferReadPosition = 0 + (this.bufferReadPosition + numberOfReadByts - this.buffer.length)
        else
            this.bufferReadPosition += numberOfReadByts;
    }

    private processBuffer() {
        while (true) {
            const toReadBytes = Math.abs(this.bufferWritePosition - this.bufferReadPosition);
            if (toReadBytes < 8) /* header size */ {
                break;
            }

            // read header
            const header = new RequestResponseHeader();
            header.parse(this.readFromBuffer(8 /* header size */));
            if (header === undefined || toReadBytes < header?.getSize()) {
                //console.log("NOT ENOUGH BYTES FOR COMPLETE PACKAGE");
                break;
            }

            this.setReadPosition(header.getPackageSize());
            const recPackage = new ReceivedPackage();
            recPackage.header = header;
            recPackage.ipAddress = this.connectedPeerAddress ?? "";
            if (header.getSize() > 8) {
                recPackage.payLoad = this.readFromBuffer(header.getSize() - header.getPackageSize(), true);
            } else {
                recPackage.payLoad = new Uint8Array(0);
            }
            if (this.onPackageReceived)
                this.onPackageReceived(recPackage);
        }
    }

    private initialize(): void {
        this.bufferReadPosition = 0;
        this.bufferWritePosition = 0;

        if (!this.isElectron && this.webSocket) {
            this.webSocket.onmessage = (event: any): void => {
                const jsonData = JSON.parse(event.data);
                if (jsonData.message === 'connect done') {
                    this.onPeerConnect();
                }
                else if (jsonData.message === 'disconnect done') {
                    if (this.onPeerDisconnected)
                        this.onPeerDisconnected();
                } else if (jsonData.message && jsonData.message.indexOf("ConnectionResetError") >= 0) {
                    // when the peer closes the conection this error occures. if we are publishing we want to reconnect now
                    this.reconnectPeer();
                }
                else if (jsonData.message === 'recv data') {
                    const byteArray = Uint8Array.from(atob(jsonData.data), c => c.charCodeAt(0));
                    this.writeBuffer(byteArray);
                }
            };
            this.webSocket.onopen = (): void => {
                this.isWsConnected = true;
                if (this.onReady)
                    this.onReady();
            };
            this.webSocket.onclose = (): void => {
                this.isWsConnected = false;
                this.peerConnected = false;
                if (this.onWsDisconnected)
                    this.onWsDisconnected();
            };
        } else if (this.socket) {

            if (this.onReady)
                this.onReady();
        }
    }

    /**
     * connects to a specific peer
     * @param ip node/peer ip address
     */
    public connect(ip: string): void {

        this.connectPeer(ip);

    }

    sendPackage(data: Uint8Array): boolean {
        if (!this.isElectron) {
            return this.sendWsPackage(data);
        } else {
            return this.sendTcpPackage(data);
        }
    }

    private sendWsPackage(data: Uint8Array): boolean {
        if (!this.isWsConnected || !this.peerConnected) {
            return false;
        }
        //console.log("REQUEST", data);
        this.webSocket?.send(JSON.stringify(
            {
                command: 'sendb',
                data: this.toBase64(data)
            }
        ));

        return true;
    }

    private sendTcpPackage(data: Uint8Array): boolean {
        if (!this.peerConnected) {
            return false;
        }
        this.socket?.write(data);

        return true;
    }

    /**
     * starts the connection
     */
    public start(): void {
        this.initialize();
    }
    /**
     * stops the web bridge ws connection
     */
    public stop(): void {
        this.disconnectPeer();
    }
}