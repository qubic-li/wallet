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
import {UpdaterService} from "../services/updater-service";

@Component({
  selector: 'app-assets',
  templateUrl: './assets.component.html',
  styleUrls: ['./assets.component.scss']
})

export class AssetsComponent implements OnInit {

  displayedColumns: string[] = ['publicId', 'contractIndex', 'assetName', 'contractName', 'ownedAmount', 'possessedAmount', 'tick', 'reportingNodes'];
  public assets: QubicAsset[] = [];
  public currentTick = 0;
  public tickOverwrite = false;

  sendForm: FormGroup;
  showSendForm: boolean = false;
  balanceTooLow: boolean = false; // logic


  constructor(private apiService: ApiService, private walletService: WalletService, private updaterService: UpdaterService) {
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

    this.updaterService.currentTick.subscribe(tick => {
      this.currentTick = tick;
      this.sendForm.controls['tick'].addValidators(Validators.min(tick));
      if (!this.tickOverwrite) {
        this.sendForm.controls['tick'].setValue(tick + this.walletService.getSettings().tickAddition);
      }
    })
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

  handleTickEdit(): void {
    const currentTickValue = this.sendForm.controls['tick'].value;
    if (currentTickValue < this.currentTick) {
      this.sendForm.controls['tick'].setValue(this.currentTick + this.walletService.getSettings().tickAddition);
    }
    // Activer ou désactiver la surcharge du tick
    this.tickOverwrite = !this.tickOverwrite;
  }

  getSeedAlias(publicId: string) {
    return this.walletService.getSeed(publicId)?.alias;
  }

  openSendForm(): void {
    this.showSendForm = true;

    this.tickOverwrite = false;
    this.sendForm.controls['tick'].setValue(this.currentTick + this.walletService.getSettings().tickAddition);

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
    this.tickOverwrite = false;
    this.sendForm.reset();
  }

  async sendAsset() {

    // todo: form/input validation


    // todo: create central transaction service to send transactions!!!!

    // sample send asset function

    const sourcePublicKey = ""; // must be the sender/owner of th easset
    const assetName = ""; // must be the name of the asset to be transfered
    const numberOfUnits = 0; // must be the number of units to be transfered
    const currentTick = await lastValueFrom(this.apiService.getCurrentTick());

    // todo: think about if we want to let the user set a custom target tick
    const targetTick = currentTick.tick + this.walletService.getSettings().tickAddition; // set tick to send tx

    // load the seed from wallet service
    const signSeed = await this.walletService.revealSeed(sourcePublicKey); // must be the seed to sign the transaction

    const assetTransfer = new QubicTransferAssetPayload()
    .setIssuer(sourcePublicKey)
    .setPossessor(sourcePublicKey)
    .setnewOwner(sourcePublicKey)
    .setAssetName(assetName)
    .setNumberOfUnits(numberOfUnits);


  // build and sign tx
  const tx = new QubicTransaction().setSourcePublicKey(sourcePublicKey)
    .setDestinationPublicKey(QubicDefinitions.QX_ADDRESS) // a transfer should go the QX SC
    .setAmount(QubicDefinitions.QX_TRANSFER_ASSET_FEE)
    .setTick(targetTick) // just a fake tick
    .setInputType(QubicDefinitions.QX_TRANSFER_ASSET_INPUT_TYPE)
    .setPayload(assetTransfer);

  await tx.build(signSeed);


    // send transaction to network
    // todo: here will be the call to the new transaction service. which will submit the transaction to the network

  }
}
