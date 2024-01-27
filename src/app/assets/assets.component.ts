import {Component, OnInit} from '@angular/core';
import {QubicAsset} from "../services/api.model";
import {ApiService} from "../services/api.service";
import {FormControl, FormGroup, Validators} from "@angular/forms";

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


  constructor(private apiService: ApiService) {
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


}
