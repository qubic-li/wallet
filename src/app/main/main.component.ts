import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ConfirmDialog } from '../core/confirm-dialog/confirm-dialog.component';
import { UnLockComponent } from '../lock/unlock/unlock.component';
import { ISeed } from '../model/seed';
import { WalletService } from '../services/wallet.service';
import { SeedEditDialog } from './edit-seed/seed-edit.component';
import { RevealSeedDialog } from './reveal-seed/reveal-seed.component';
import { Router } from '@angular/router';
import { QrReceiveDialog } from './qr-receive/qr-receive.component';
import { ApiService } from '../services/api.service';
import { BalanceResponse, Transaction } from '../services/api.model';
import {MatSort} from '@angular/material/sort';
import { UpdaterService } from '../services/updater-service';

@Component({
  selector: 'qli-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements AfterViewInit {

  displayedColumns: string[] = ['alias', 'publicId', 'balance', 'currentEstimatedAmount', 'actions'];
  dataSource!: MatTableDataSource<ISeed>;
  balances: BalanceResponse[] = [];

  @ViewChild(MatTable)
  table!: MatTable<ISeed> ;

  @ViewChild(MatSort)
  sort!: MatSort;


  constructor(public walletService: WalletService, public dialog: MatDialog, private router: Router, us: UpdaterService) {
    this.setDataSource();
    us.currentBalance.subscribe(b => {
      this.balances = b;
      this.setDataSource();
    })
  }
  ngAfterViewInit(): void {
    this.setDataSource();
  }

  setDataSource(): void {
    this.dataSource = new MatTableDataSource(this.walletService.getSeeds().map(m => {
      m.balance = this.getBalance(m.publicId);
      (<any>m).currentEstimatedAmount = this.getEpochChanges(m.publicId);
      return m;
    }));
    this.dataSource.sort = this.sort;
  }

  getBalance(publicId: string): number{
    var balanceEntry = this.balances.find(f => f.publicId === publicId);
    return balanceEntry?.currentEstimatedAmount ?? balanceEntry?.epochBaseAmount ?? 0;
  }


  getEpochChanges(publicId: string): number{
    var balanceEntry = this.balances.find(f => f.publicId === publicId);
    return balanceEntry?.epochChanges ?? 0;
  }

  refreshData() {
    this.setDataSource();
    this.table.renderRows();
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
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
        this.setDataSource();
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
