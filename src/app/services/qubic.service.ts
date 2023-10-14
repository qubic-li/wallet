import { Injectable } from '@angular/core';
import { HashMap } from '@ngneat/transloco';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { QubicConnector } from 'src/lib/qubic/connector/QubicConnector';
import { PackageBuilder } from 'src/lib/qubic/packages/PackageBuilder';
import { PublicKey } from 'src/lib/qubic/packages/PublicKey';
import { QubicEntity } from 'src/lib/qubic/packages/QubicEntity';
import { QubicEntityRequest } from 'src/lib/qubic/packages/QubicEntityRequest';
import { QubicEntityResponse } from 'src/lib/qubic/packages/QubicEntityResponse';
import { QubicPackageType } from 'src/lib/qubic/packages/QubicPackageType';
import { QubicTickInfo } from 'src/lib/qubic/packages/QubicTickInfo';
import { RequestResponseHeader } from 'src/lib/qubic/packages/RequestResponseHeader';
import { BalanceResponse, PeerDto, Transaction } from './api.model';
import { ApiService } from './api.service';
import { UpdaterService } from './updater-service';
import { WalletService } from './wallet.service';
import { VisibilityService } from './visibility.service';

/**
 * Main Qubic Service which connects to the qubic network
 */
@Injectable({
    providedIn: 'root'
})
export class QubicService {

    private tickInfoRefrshInterval = 2000;
    private entityRefreshInterval = 30000;
    private qon: QubicConnector = new QubicConnector();
    private peerList: PeerDto[] = [];
    private currentTickInterval: any;
    private entityInterval: any;
    private useBridge = false;
    public currentTick: BehaviorSubject<number> = new BehaviorSubject(0);
    public isConnected: BehaviorSubject<boolean> = new BehaviorSubject(false);
    private publicIds: PublicKey[] = [];
    private desiredConnected: boolean = false;
    private balanceCallbackQueue: ((entityResponse: QubicEntityResponse) => boolean)[] = [];
    private bridgeConnected = false;

    constructor(private visibilityService: VisibilityService, private updateService: UpdaterService, private walletService: WalletService, private api: ApiService) {
        walletService.config.subscribe(c => {
            this.useBridge = c.useBridge;
            this.checkConnection();
        });
        api.currentPeerList.subscribe(s => {
            this.peerList = s;
            this.checkConnection();
        });

        this.visibilityService.isActive().subscribe(isActive => {
            if (!isActive) {
                this.bridgeConnected = this.isConnected.getValue();
                this.disconnect();
            } else {
                if (this.bridgeConnected)
                    this.connect();
            }
        });
    }

    private checkConnection() {
        if (!this.useBridge) {
            this.qon.stop();
        } else {
            if (!this.isConnected.getValue() && this.peerList.length > 0) {
                this.connect();
            }
        }
    }

    private getPeer(): string {
        return this.peerList[this.getRandomInt(0, this.peerList.length - 1)].ipAddress;
    }

    private getRandomInt(min: number, max: number): number {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min);
    }

    private init(): void {
        this.qon.onPackageReceived = p => {
            if (p.header.getType() == QubicPackageType.RESPOND_CURRENT_TICK_INFO) {
                const tickInfo = new QubicTickInfo().parse(p.payLoad);
                if (tickInfo && this.currentTick.getValue() < tickInfo.getTick()) {
                    this.currentTick.next(tickInfo.getTick());
                    this.updateService.currentTick.next(tickInfo.getTick());
                }
            } else if (p.header.getType() == QubicPackageType.RESPOND_ENTITY) {
                const entityResponse = new QubicEntityResponse().parse(p.payLoad);
                if (entityResponse)
                    this.processEntityResponse(entityResponse);
            }
        };
        this.qon.onWsDisconnected = () => {
            this.isConnected.next(false);
            clearInterval(this.currentTickInterval);
            clearInterval(this.entityInterval);
        }
        this.qon.onReady = () => {
            this.qon.connect(this.getPeer());
        }
        this.qon.onPeerConnected = () => {
            this.isConnected.next(true);
            this.requestEntities();
            this.currentTickInterval = setInterval(() => {
                this.requestTickInfo();
            }, this.tickInfoRefrshInterval);
            this.entityInterval = setInterval(() => {
                this.requestEntities();
            }, this.entityRefreshInterval);
        }
        this.qon.onPeerDisconnected = () => {
            this.isConnected.next(false);
            clearInterval(this.currentTickInterval);
            clearInterval(this.entityInterval);
            this.reconnect();
        }
        this.qon.start();
    }

    private requestTickInfo() {
        if (this.isConnected) {
            const header = new RequestResponseHeader(QubicPackageType.REQUEST_CURRENT_TICK_INFO)
            header.randomizeDejaVu();
            this.qon.sendPackage(header.getPackageData());
        }
    }

    public connect(): void {
        if (!this.walletService.getSettings().useBridge)
            return;

        this.desiredConnected = true;
        this.reconnect();
    }

    public reconnect(): void {
        if (this.isConnected)
            this.qon.stop();
        if (this.desiredConnected) {
            this.qon = new QubicConnector();
            this.init();
        }
    }

    public disconnect(): void {
        this.desiredConnected = false;
        this.qon.stop();
    }

    private processEntityResponse(entityResponse: QubicEntityResponse) {
        if (this.currentTick.getValue() <= entityResponse.getTick()) {
            const pkey = this.publicIds.find(f => entityResponse.getEntity().getPublicKey().equals(f));
            if (pkey && pkey.getIdentityAsSring() !== undefined)
                this.walletService.updateBalace(pkey.getIdentityAsSring()!, entityResponse.getEntity().getBalance(), entityResponse.getTick());
        }
        this.balanceCallbackQueue = this.balanceCallbackQueue.filter(m => m && !m(entityResponse));
    }

    private requestEntities(): void {
        if (this.isConnected) {
            this.publicIds = [];
            let i = 0;
            this.walletService.getSeeds().forEach((s) => {
                window.setTimeout(() => {
                    const pkey = new PublicKey(s.publicId);
                    this.publicIds.push(pkey);
                    this.updateBalance(pkey);
                }, i * 200);
                i++;
            });
        }
    }

    public updateBalance(pkey: PublicKey, callbackFn: undefined | ((entityResponse: QubicEntityResponse) => boolean) = undefined): boolean {
        if (!this.isConnected)
            return false;
        const header = new RequestResponseHeader(QubicPackageType.REQUEST_ENTITY, pkey.getPackageSize())
        header.randomizeDejaVu();
        const builder = new PackageBuilder(header.getSize());
        builder.add(header);
        builder.add(new QubicEntityRequest(pkey));
        const data = builder.getData();
        if (callbackFn)
            this.balanceCallbackQueue.push(callbackFn);
        return this.qon.sendPackage(data);
    }
}
