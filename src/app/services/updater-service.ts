import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { BalanceResponse, Transaction } from './api.model';
import { ApiService } from './api.service';
import { WalletService } from './wallet.service';

@Injectable({
  providedIn: 'root'
})
export class UpdaterService {

  public currentTick: BehaviorSubject<number> = new BehaviorSubject(0);
  public currentBalance: BehaviorSubject<BalanceResponse[]> = new BehaviorSubject<BalanceResponse[]>([]);
  public errorStatus: BehaviorSubject<string> = new BehaviorSubject<string>("");

  constructor(private api: ApiService, private walletService: WalletService) {
    this.init();
  }

  private init(): void {
    this.getCurrentTick();
    this.getCurrentBalance();
    setInterval(() => {
      this.getCurrentTick();
      this.getCurrentBalance();
    }, 10000);
  }

  private getCurrentTick() {
    // todo: Use Websocket!
    this.api.getCurrentTick().subscribe(r => {
      if (r && r.tick) {
        this.currentTick.next(r.tick);
      }
    }, errorResponse => {
      console.log("errr", errorResponse);
      this.processError(errorResponse);
    });
  }

  private getCurrentBalance() {
    if (this.walletService.getSeeds().length > 0) {
      // todo: Use Websocket!
      this.api.getCurrentBalance(this.walletService.getSeeds().map(m => m.publicId)).subscribe(r => {
        if (r) {
          this.currentBalance.next(r);
        }
      }, errorResponse => {
        this.processError(errorResponse);
      });
    }
  }

  private processError(errObject: any) {
    if (errObject.statusText) {
      this.errorStatus.next(errObject.statusText);
    }
  }

  forceUpdateCurrentTick() {
    this.getCurrentTick();
  }

}
