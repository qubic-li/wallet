import {Component, Inject, OnInit} from '@angular/core';
import {QubicAsset} from "../services/api.model";
import {ApiService} from "../services/api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import { WalletService } from '../services/wallet.service';
import { QubicTransferAssetPayload } from 'qubic-ts-library/dist/qubic-types/transacion-payloads/QubicTransferAssetPayload';
import { QubicTransaction } from 'qubic-ts-library/dist/qubic-types/QubicTransaction';
import { QubicDefinitions } from 'qubic-ts-library/dist/QubicDefinitions';
import { DynamicPayload } from 'qubic-ts-library/dist/qubic-types/DynamicPayload';
import { lastValueFrom } from 'rxjs';
import {ISeed} from "../model/seed";
import {MAT_DIALOG_DATA} from "@angular/material/dialog";

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss']
})

export class AssetsComponent implements OnInit {

  displayedColumns: string[] = ['publicId', 'contractIndex', 'assetName', 'contractName', 'ownedAmount', 'possessedAmount', 'tick', 'reportingNodes'];
  public assets: QubicAsset[] = [];
  

  sendForm: FormGroup;
  showSendForm: boolean = false;
  balanceTooLow: boolean = false; // logic


  constructor(private apiService: ApiService, private walletService: WalletService) {
    this.sendForm = new FormGroup({
      destinationAddress: new FormControl('', Validators.required),
      amount: new FormControl('', Validators.required),
      tick: new FormControl('', Validators.required),
      assetSelect: new FormControl('', Validators.required),
    });

    const amountControl = this.sendForm.get('amount');
    const assetSelectControl = this.sendForm.get('assetSelect');

    if (amountControl) {
      amountControl.valueChanges.subscribe(() => {
        this.updateAmountValidator();
      });
    }

    if (assetSelectControl) {
      assetSelectControl.valueChanges.subscribe(() => {
        this.updateAmountValidator();
      });
    }
  }

  updateAmountValidator(): void {
    const assetSelectControl = this.sendForm.get('assetSelect');
    const amountControl = this.sendForm.get('amount');

    if (assetSelectControl && amountControl) {
      const selectedAsset = assetSelectControl.value;
      const maxAmount = selectedAsset ? selectedAsset.ownedAmount : 0;

      amountControl.setValidators([
        Validators.required,
        Validators.min(0),
        Validators.max(maxAmount)
      ]);

      amountControl.updateValueAndValidity();
    }
  }

  ngOnInit() {
    this.loadAssets();
    console.log("Hello: " + this.assets);
  }

  refreshData(): void {
     this.loadAssets(true);
  }

  loadAssets(force: boolean = false) {

    const publicIds = this.walletService.getSeeds().map(seed => seed.publicId);

    this.assets = force ? [] : this.walletService.getSeeds().flatMap(m => m.assets).filter(f => f).map(m => <QubicAsset>m);

    console.log("ASSETS", this.assets);


    // todo: if we load assets they should be stored in walletservice => use central function to load assets

    // only load assets from API if they were not already loaded before or it is empty
    if(this.assets.length <= 0){
      this.apiService.getOwnedAssets(publicIds).subscribe({
        next: (assets: QubicAsset[]) => {
          this.assets = assets;
        },
        error: (error) => {
          console.error('Error when loading assets', error);
        }
      });
    }
  }

  getSeedAlias(publicId: string) {
    return this.walletService.getSeed(publicId)?.alias;
  }

  openSendForm(): void {
    this.showSendForm = true;
    const assetSelectControl = this.sendForm.get('assetSelect');
    if (assetSelectControl && this.assets.length > 0) {
      assetSelectControl.setValue(this.assets[0]);
      this.updateAmountValidator();
    }
  }

  onSubmitSendForm(): void {
    if (this.sendForm.valid) {
      // logic
    }
  }

  cancelSendForm(): void {
    this.showSendForm = false;
    this.sendForm.reset();
  }


}
