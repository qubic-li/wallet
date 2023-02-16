import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
  templateUrl: './welcome.component.html',
  styleUrls: ['./welcome.component.scss']
})
export class WelcomeComponent implements OnInit {
  
  public currentTick = 0;

  autoTick: FormControl = new FormControl(true);
  
  transferForm = this.fb.group({
    sourceId: [],
    destinationId: ["", [Validators.required, Validators.minLength(60), Validators.maxLength(60)]],
    amount: [10000, [Validators.required, Validators.min(1)]],
    tick: [0, [Validators.required]],
    autoTick: this.autoTick
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

  // changeAutoTick(v: MatCheckboxChange): void {
  //   if (v.checked)
  //     this.tickFormControl.disable();
  //   else
  //     this.tickFormControl.enable();
  //   this.changeDetectorRef?.detectChanges();
  // }

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
        new QubicHelper().createTransaction(s, this.transferForm.controls.destinationId.value!,this.transferForm.controls.amount.value!, this.transferForm.controls.tick.value!).then(tx => {

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

  getSeeds() {
    return this.walletService.getSeeds();
  }

  loadKey(){
    const dialogRef = this.dialog.open(UnLockComponent, {restoreFocus: false});
  }
}
