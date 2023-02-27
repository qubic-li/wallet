import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { WalletService } from '../services/wallet.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslocoService } from '@ngneat/transloco';
import { BalanceResponse, Transaction } from '../services/api.model';
import { FormControl } from '@angular/forms';
import { UpdaterService } from '../services/updater-service';

@Component({
  selector: 'app-balance',
  templateUrl: './balance.component.html',
  styleUrls: ['./balance.component.scss']
})
export class BalanceComponent implements OnInit {
  
  public accountBalances: BalanceResponse[] = [];
  public seedFilterFormControl: FormControl = new FormControl();

  constructor(private transloco: TranslocoService, private api: ApiService, private walletService: WalletService, private _snackBar: MatSnackBar, private us: UpdaterService) {

  }

  ngOnInit(): void {
    if(this.hasSeeds()){
      this.us.currentBalance.subscribe(response => {
        this.accountBalances = response;
      }, errorResponse => {
        this._snackBar.open(errorResponse.error, this.transloco.translate("general.close"), {
          duration: 0,
          panelClass: "error"
        });
      });
    }
  }

  getDate() {
    return new Date();
  }

  getTotalBalance(estimaed = false): number {
    if(estimaed)
      return this.accountBalances.reduce((p, c) => p + (c.currentEstimatedAmount), 0);
    else
      return this.accountBalances.reduce((p, c) => p + (c.epochBaseAmount), 0);
  }

  hasSeeds() {
    return this.walletService.seeds.length > 0;
  }

  onlyUnique(value: Transaction, index:any, array:Transaction[]) {
    return array.findIndex((f: Transaction) => f.id === value.id) == index;
  }

  getTransactions(publicId: string | null = null): Transaction[] {
    return this.accountBalances.flatMap((b) => b.transactions.filter(f => publicId == null || f.sourceId == publicId || f.destId == publicId))
      .filter(this.onlyUnique)
      .sort((a,b) =>  { return (<any>new Date(b.created)) - (<any>new Date(a.created))});
  }

  isOwnId(publicId: string): boolean {
    return this.walletService.seeds.find(f => f.publicId == publicId) !== undefined;
  }

  getSeedName(publicId: string): string {
    var seed = this.walletService.seeds.find(f => f.publicId == publicId);
    if(seed !== undefined)
      return '(' + seed.alias + ')';
    else
      return '';
  }

  getSeeds() {
    return this.walletService.getSeeds();
  }
}
