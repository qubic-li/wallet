import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, Validators } from '@angular/forms';
import { MatCheckbox, MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { UnLockComponent } from '../lock/unlock/unlock.component';
import { WalletService } from '../services/wallet.service';
import { QubicHelper } from 'src/lib/qubic/qubicHelper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../services/api.service';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';

@Component({
  selector: 'app-wallet',
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit {
  

  private selectedDestinationId: any;

  @ViewChild('selectedDestinationId', {
    static: false
  }) set selectedDestinationIdContent(content: any) {
     if(content) { // initially setter gets called with undefined
         this.selectedDestinationId = content;
     }
  }

  public currentTick = 0;
  public selectedAccountId = false;
  
  private destinationValidators = [Validators.required, Validators.minLength(60), Validators.maxLength(60)];

  transferForm = this.fb.group({
    sourceId: [],
    destinationId: ["", this.destinationValidators],
    selectedDestinationId: [""],
    amount: [10000, [Validators.required, Validators.min(1)]],
    tick: [0, [Validators.required]],
  });

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private changeDetectorRef: ChangeDetectorRef, private api: ApiService, private _snackBar: MatSnackBar, public walletService: WalletService, private dialog: MatDialog)
   {
    // this.tickFormControl.disable();
    this.getCurrentTick();
   }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if(params['publicId']){
        const publicId = params['publicId'];
        this.transferForm.controls.sourceId.setValue(publicId);
      }
    });
    this.route.params.subscribe(params => {
      if(params['receiverId']){
        const publicId = params['receiverId'];
        this.transferForm.controls.destinationId.setValue(publicId);
      }
      if(params['amount']){
        const amount = params['amount'];
        this.transferForm.controls.amount.setValue(amount);
      }
   });
   this.transferForm.controls.sourceId.valueChanges.subscribe(s => {
      if(this.transferForm.controls.selectedDestinationId.value == this.transferForm.controls.sourceId.value)
      {
        this.transferForm.controls.selectedDestinationId.setValue(null);
      }
   });
  }

   getCurrentTick() {
    this.api.getCurrentTick().subscribe(r => {
      if(r && r.tick){
        this.currentTick = r.tick;
        this.transferForm.controls.tick.setValue(r.tick + 10);
        this.transferForm.controls.tick.addValidators(Validators.min(r.tick));
      }
    });
   }

   init() {
    this.transferForm.reset();
    this.getCurrentTick();
   }

  onSubmit(): void {
    if(!this.walletService.privateKey)
    {
      this._snackBar.open("Please unlock your Wallet first", "close", {
        duration: 5000,
        panelClass: "error"
      });
    }
    if(this.transferForm.valid){
      this.walletService.revealSeed((<any>this.transferForm.controls.sourceId.value)).then(s => {
        let destinationId = this.selectedAccountId ? this.transferForm.controls.selectedDestinationId.value : this.transferForm.controls.destinationId.value;
        new QubicHelper().createTransaction(s, destinationId!, this.transferForm.controls.amount.value!, this.transferForm.controls.tick.value!).then(tx => {
          // hack to get uintarray to array for sending to api
          this.api.submitTransaction({SignedTransaction: this.walletService.arrayBufferToBase64(tx)}).subscribe(r => {
            if(r && r.id){
              this._snackBar.open("Your transaction (" + r.id + ") has been stored for propagation", "close", {
                duration: 3000,
              });
              this.init();
            }
          }, er => {
            this._snackBar.open("Your transaction could not be sent. Pleas try again later.", "close", {
              duration: 5000,
              panelClass: "error"
            });
          });
        });
      }).catch(e => {
        this._snackBar.open("We were not able to decrypt your seed. Do you use the correct private key?", "close", {
          duration: 10000,
          panelClass: "error"
        });
      });
    }else{
      this._snackBar.open("We hat validation errors. Please check the form.", "close", {
        duration: 5000,
        panelClass: "error"
      });
    }
  }

  toggleDestinationSelect() {
    this.selectedAccountId = !this.selectedAccountId;
    this.changeDetectorRef?.detectChanges();
    if(this.selectedAccountId)
    {
      this.selectedDestinationId.open();  
      this.transferForm.controls.selectedDestinationId.addValidators([Validators.required]);
      this.transferForm.controls.destinationId.clearValidators();
      this.transferForm.controls.destinationId.updateValueAndValidity();
      this.transferForm.controls.selectedDestinationId.updateValueAndValidity();
    }else{
      this.transferForm.controls.destinationId.addValidators(this.destinationValidators);
      this.transferForm.controls.selectedDestinationId.clearAsyncValidators();
      this.transferForm.controls.destinationId.updateValueAndValidity();
      this.transferForm.controls.selectedDestinationId.updateValueAndValidity();
    }
    this.changeDetectorRef?.detectChanges();
  }
  getSeeds(isDestination = false) {
    return this.walletService.getSeeds().filter(f => !isDestination || f.publicId != this.transferForm.controls.sourceId.value);
  }

  loadKey(){
    const dialogRef = this.dialog.open(UnLockComponent, {restoreFocus: false});
  }
}

