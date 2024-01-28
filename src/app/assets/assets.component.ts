import {Component, OnInit} from '@angular/core';
import {QubicAsset} from "../services/api.model";
import {ApiService} from "../services/api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import { WalletService } from '../services/wallet.service';
import { QubicTransferAssetPayload } from 'qubic-ts-library/dist/qubic-types/transacion-payloads/QubicTransferAssetPayload';
import { QubicTransaction } from 'qubic-ts-library/dist/qubic-types/QubicTransaction';
import { QubicDefinitions } from 'qubic-ts-library/dist/QubicDefinitions';
import { DynamicPayload } from 'qubic-ts-library/dist/qubic-types/DynamicPayload';
import { lastValueFrom } from 'rxjs';

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

    // Sécuriser les souscriptions avec des vérifications
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
  }

  refreshData(): void {
     this.loadAssets();
  }

  protected loadAssets(): void {
    // TODO replace
    const publicIds = ['id1', 'id2'];

    this.apiService.getOwnedAssetsM(publicIds).subscribe(
      (assets: QubicAsset[]) => {
        this.assets = assets;
      },
      error => {
        console.error('Error when loading assets', error);
      }
    );
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
