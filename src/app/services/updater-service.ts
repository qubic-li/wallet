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
  private tickLoading = false;
  private balanceLoading = false;

  constructor(private api: ApiService, private walletService: WalletService) {
    this.init();
  }

  private init(): void {
    this.getCurrentTick();
    this.getCurrentBalance();
    setInterval(() => {
      this.getCurrentTick();
    }, 30000);
    setInterval(() => {
      this.getCurrentBalance();
    }, 60000);
  }

  private getCurrentTick() {
    if(this.tickLoading)
      return;

    this.tickLoading = true;
    // todo: Use Websocket!
    this.api.getCurrentTick().subscribe(r => {
      if (r && r.tick) {
        this.currentTick.next(r.tick);
      }
      this.tickLoading = false;
    }, errorResponse => {
      this.processError(errorResponse, false);
      this.tickLoading = false;
    });
  }

  public loadCurrentBalance() {
    this.getCurrentBalance();
  }

  private getCurrentBalance() {
    if(this.balanceLoading)
      return;

    this.balanceLoading = true;
    if (this.walletService.getSeeds().length > 0) {
      // todo: Use Websocket!
      this.api.getCurrentBalance(this.walletService.getSeeds().map(m => m.publicId)).subscribe(r => {
        if (r) {
          this.currentBalance.next(r);
        }
        this.balanceLoading = false;
      }, errorResponse => {
        this.processError(errorResponse, false);
        this.balanceLoading = false;
      });
    }
  }

  private processError(errObject: any, showToUser: boolean = true) {
    if(errObject.status == 401){
      this.api.reAuthenticate();
    }else if (errObject.statusText) {
      if(showToUser)
        this.errorStatus.next(errObject.statusText);
    }
  }

  forceUpdateCurrentTick() {
    this.getCurrentTick();
  }

}
