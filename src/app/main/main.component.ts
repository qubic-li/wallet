import { Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
import { ConfirmDialog } from '../core/confirm-dialog/confirm-dialog.component';
import { UnLockComponent } from '../lock/unlock/unlock.component';
import { ISeed } from '../model/seed';
import { WalletService } from '../services/wallet.service';
import { SeedEditDialog } from './edit-seed/seed-edit.component';
import { RevealSeedDialog } from './reveal-seed/reveal-seed.component';
import { Router } from '@angular/router';
import { QrReceiveDialog } from './qr-receive/qr-receive.component';
import { ApiService } from '../services/api.service';
import { BalanceResponse } from '../services/api.model';


@Component({
  selector: 'qli-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent {

  displayedColumns: string[] = ['alias', 'computorId', 'balance', 'actions'];
  dataSource: ISeed[] = [];
  balances: BalanceResponse[] = [];

  @ViewChild(MatTable)
  table!: MatTable<ISeed>;


  constructor(public walletService: WalletService, public dialog: MatDialog, private router: Router, api: ApiService) {
    this.dataSource = [...walletService.seeds];
    api.getCurrentBalance(this.walletService.seeds.map(m => m.publicId)).subscribe(s => {
      if (s) {
        this.balances = s;
      }
    });
  }

  getBalance(publicId: string): number{
    var balanceEntry = this.balances.find(f => f.publicId === publicId);
    if(balanceEntry && balanceEntry.epochBaseAmount) {
      return balanceEntry.epochBaseAmount;
    }else {
      return 0;
    }
  }

  refreshData() {
    this.dataSource = [...this.walletService.seeds];
    this.table.renderRows();
  }

  addSeed() {
    if (!this.walletService.publicKey) {
      const dialogRef = this.dialog.open(UnLockComponent, { restoreFocus: false });
      dialogRef.afterClosed().subscribe((r) => {
        if (this.walletService.privateKey) {
          const dialogRef = this.dialog.open(SeedEditDialog, {
            restoreFocus: false, data: {
              seed: null
            }
          });
          dialogRef.afterClosed().subscribe((r) => {
            // do anything :)
            this.refreshData();
          });
        }
      });
    } else {
      const dialogRef = this.dialog.open(SeedEditDialog, {
        restoreFocus: false, data: {
          seed: null
        }
      });
      dialogRef.afterClosed().subscribe((r) => {
        // do anything :)
        this.dataSource = [...this.walletService.seeds];
        this.table.renderRows();
      });
    }

  }


  payment(publicId: string) {
    this.router.navigate(['/', 'payment'], {
      queryParams: {
        publicId: publicId
      }
    });
  }

  edit(publicId: string) {
    const confirmDialo = this.dialog.open(SeedEditDialog, {
      restoreFocus: false, data: {
        publicId: publicId
      }
    });
  }


  receive(publicId: string) {
    const qrDialog = this.dialog.open(QrReceiveDialog, {
      restoreFocus: false, data: {
        publicId: publicId
      }
    });
  }

  reveal(publicId: string) {
    const confirmDialo = this.dialog.open(RevealSeedDialog, {
      restoreFocus: false, data: {
        publicId: publicId
      }
    });
  }

  delete(publicId: string) {
    const confirmDialo = this.dialog.open(ConfirmDialog, { restoreFocus: false });
    confirmDialo.afterClosed().subscribe(result => {
      if (result) {
        this.walletService.deleteSeed(publicId);
        this.refreshData();
      }
    })
  }

}
