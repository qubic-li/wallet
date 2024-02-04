import { Dialog, DialogRef } from '@angular/cdk/dialog';
import {
  ChangeDetectorRef,
  Component,
  Injector,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { WalletService } from 'src/app/services/wallet.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialog } from 'src/app/core/confirm-dialog/confirm-dialog.component';
import { TranslocoService } from '@ngneat/transloco';
import { ThemeService } from 'src/app/services/theme.service';
import { QubicDialogWrapper } from 'src/app/core/dialog-wrapper/dialog-wrapper';
import { UpdaterService } from 'src/app/services/updater-service';
import { MatStepper } from '@angular/material/stepper';
import { QubicHelper } from 'qubic-ts-library/dist/qubicHelper';
import { IDecodedSeed } from 'src/app/model/seed';
import { Router } from '@angular/router';

@Component({
  selector: 'qli-create-vault',
  templateUrl: './create-vault.component.html',
  styleUrls: ['./create-vault.component.scss'],
})
export class CreateVaultComponent extends QubicDialogWrapper {
  @ViewChild('stepper')
  private stepper: MatStepper | undefined;

  public vaultCreated = false; // steop 1
  public addressCreated = false; // step 2
  public generatedPublicId: string = '';
  public vaultExported = false; // steop 3
  public vaultVerified = false; // steop 4

  public file: File | null = null;
  public configFile: File | null = null;
  public newUser = false;
  public pwdWrong = false;
  public selectedFileIsVaultFile = false;
  private walletService: WalletService;

  createVaultForm = this.fb.group({
    name: [null, [Validators.required, Validators.minLength(3)]],
  });

  importForm = this.fb.group({
    password: [null, [Validators.required, Validators.minLength(8)]],
  });

  dialogRef: DialogRef | null = null;

  verifyVaultFormGroup = this._formBuilder.group({
    password: ['', Validators.required],
  });
  vaultPasswordFormGroup = this._formBuilder.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
  });
  createAddressForm = this._formBuilder.group({
    name: ['Account 1', [Validators.required, Validators.minLength(3)]],
    seed: [
      '',
      [
        Validators.required,
        Validators.minLength(55),
        Validators.maxLength(55),
        Validators.pattern('[a-z]{55}'),
      ],
    ],
  });

  constructor(
    private _formBuilder: FormBuilder,
    renderer: Renderer2,
    themeService: ThemeService,
    public updaterService: UpdaterService,
    private transloco: TranslocoService,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private _snackBar: MatSnackBar,
    private injector: Injector,
    private changeDetector: ChangeDetectorRef,
    private persistedWalletService: WalletService
  ) {
    super(renderer, themeService);
    this.dialogRef = injector.get(DialogRef, null);

    this.walletService = new WalletService(false);

    this.newUser =
      this.walletService.getSeeds().length <= 0 &&
      !this.walletService.publicKey;

    this.createAddressForm.controls.seed.valueChanges.subscribe((s) => {
      if (s) this.generatePublicId(s);
    });
  }

  private nextStep() {
    window.setTimeout(() => {
      this.stepper?.next();
    }, 500);
  }

  public async generatePublicId(seed: string) {
    if (seed && seed.length == 55) {
      const helper = new QubicHelper();
      const idp = await helper.createIdPackage(seed);
      console.log('IDP', idp);
      this.generatedPublicId = idp.publicId;
      this.changeDetector.detectChanges();
    } else {
      this.generatedPublicId = '';
    }
  }

  public randomizeSeed() {
    this.createAddressForm.controls.seed.setValue(this.seedGen());
  }

  private seedGen(): string {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    const letterSize = letters.length;
    let seed = '';
    for (let i = 0; i < 55; i++) {
      seed += letters[Math.floor(Math.random() * letterSize)];
    }
    return seed;
  }

  public createVault() {
    this.gengerateNew();
  }

  public async createAddress() {
    if (this.createAddressForm.valid) {
      const seed = this.createAddressForm.controls.seed.value;
      if (seed && seed.length == 55) {
        const helper = new QubicHelper();
        const idp = await helper.createIdPackage(seed);
        const toSaveSeed = <IDecodedSeed>{
          alias: this.createAddressForm.controls.name.value!,
          publicId: idp.publicId,
          seed: seed,
          balance: 0,
        };
        this.walletService.addSeed(toSaveSeed);
        this.addressCreated = true;
        this.nextStep();
      }
    }
  }

  public exportVault() {
    this.downloadVaultFile();
  }

  public verifyVault() {
    this.importAndUnlock(this.walletService);
  }

  public async openWallet() 
  {
    await this.importAndUnlock(this.persistedWalletService);
    this.updaterService.loadCurrentBalance(true);
    this.router.navigate(['/']);
  }

  async downloadVaultFile() {
    if (this.vaultPasswordFormGroup.valid && this.walletService.privateKey) {
      if (
        await this.walletService.exportVault(
          this.vaultPasswordFormGroup.controls.password.value!
        )
      ) {
        this.vaultExported = true;
        this.nextStep();
      }
    }
  }

  // onPasswordChange() {
  //   this.pwdWrong = false;
  // }

  // isNewUser() {
  //   return this.newUser;
  // }
  // toggleNewUser(v: boolean) {
  //   this.newUser = v;
  //   this.cdr.detectChanges();
  // }

  async startCreateProcess() {
    this.walletService.clearConfig();
    await this.walletService.createNewKeys();
    this.walletService.updateName(this.createVaultForm.controls.name.value!);
    this.vaultCreated = true;
    this.nextStep();
  }

  //   // Manually restore focus to the menu trigger since the element that
  //   // opens the dialog won't be in the DOM any more when the dialog closes.
  //   lockRef.afterClosed().subscribe(() => {
  //     // do anything :)
  //     this.dialogRef?.close();
  //   });
  // }

  async gengerateNew() {
    if (this.hasExistingConfig()) {
      const confirmDialo = this.dialog.open(ConfirmDialog, {
        restoreFocus: false,
        data: {
          message: this.transloco.translate('unlockComponent.overwriteVault'),
        },
      });
      confirmDialo.afterClosed().subscribe((result) => {
        if (result) {
          this.startCreateProcess();
        }
      });
    } else {
      this.startCreateProcess();
    }
  }

  // lock() {

  //   this.dialogRef?.close();

  //   const dialogRef = this.dialog.open(LockConfirmDialog, { restoreFocus: false });

  //   // Manually restore focus to the menu trigger since the element that
  //   // opens the dialog won't be in the DOM any more when the dialog closes.
  //   dialogRef.afterClosed().subscribe(() => {

  //   });
  // }

  private async importAndUnlock(service: WalletService) {
    // one vault file
    const binaryFileData = await this.file?.arrayBuffer();
    if (binaryFileData) {
      const success = await service.importVault(
        binaryFileData,
        <any>this.verifyVaultFormGroup.controls.password.value
      );
      if (success) {
        this.pwdWrong = false;
        service.isWalletReady = true;
        this.vaultVerified = true;
        this.nextStep();
      } else {
        this._snackBar.open(
          'Import Failed (passord or file do not match)',
          'close',
          {
            duration: 5000,
            panelClass: 'error',
          }
        );
      }
    } else {
      this._snackBar.open('Unlock Failed (no file)', 'close', {
        duration: 5000,
        panelClass: 'error',
      });
    }
  }

  public hasExistingConfig() {
    return (
      this.walletService.getSeeds().length > 0 || this.walletService.publicKey
    );
  }

  // async checkImportAndUnlock() {
  //   if (this.hasExistingConfig()) {
  //     const confirmDialo = this.dialog.open(ConfirmDialog, {
  //       restoreFocus: false, data: {
  //         message: this.transloco.translate("unlockComponent.overwriteVault")
  //       }
  //     });
  //     confirmDialo.afterClosed().subscribe(result => {
  //       if (result) {
  //         start import
  //         this.importAndUnlock();
  //       }
  //     })
  //   } else {
  //     this.importAndUnlock();
  //   }
  // }

  // public async unlock(): Promise<boolean> {

  //   if (!this.importForm.valid || !this.importForm.controls.password.value || !this.file) {
  //     this.importForm.markAsTouched();
  //     this.importForm.controls.password.markAllAsTouched();
  //     return false;
  //   }

  //   let unlockPromise: Promise<Boolean> | undefined;

  //   const binaryFileData = await this.file?.arrayBuffer();

  //   if (this.selectedFileIsVaultFile) {
  //     if (binaryFileData) {
  //       unlockPromise = this.walletService.unlockVault(binaryFileData, (<any>this.importForm.controls.password.value));
  //     } else {
  //       this._snackBar.open("Unlock Failed (no file)", "close", {
  //         duration: 5000,
  //         panelClass: "error"
  //       });
  //     }
  //   } else {
  //     // legacy
  //     this.pwdWrong = true;
  //     unlockPromise = this.walletService.unlock(binaryFileData, (<any>this.importForm.controls.password.value));

  //   }

  //   if (unlockPromise) {
  //     await unlockPromise.then(r => {
  //       if (r) {
  //         this.pwdWrong = false;
  //         this.walletService.isWalletReady = true;
  //         this.updaterService.loadCurrentBalance(true);
  //         this.dialogRef?.close();
  //       } else {
  //         this._snackBar.open("Import Failed", "close", {
  //           duration: 5000,
  //           panelClass: "error"
  //         });
  //       }
  //     }).catch(r => {
  //       this._snackBar.open("Import Failed (passord or file do not match)", "close", {
  //         duration: 5000,
  //         panelClass: "error"
  //       });
  //     });
  //     return true;
  //   }

  //   return false;
  // }

  // onSubmit(event: any): void {
  //   event.stopPropagation();
  //   event.preventDefault();
  //   this.unlock();
  // }

  async onFileSelected(event: any): Promise<void> {
    this.file = event?.target.files[0];
    if (this.file) {
      const binaryVaultFile = await this.file.arrayBuffer();
      this.selectedFileIsVaultFile =
        this.walletService.isVaultFile(binaryVaultFile);
    }
  }

  // async onConfigFileSelected(event: any): Promise<void> {
  //   this.configFile = event?.target.files[0];
  // }
}
