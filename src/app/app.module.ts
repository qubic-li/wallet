import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCardModule } from '@angular/material/card';
import { ReactiveFormsModule } from '@angular/forms';
import { NavigationComponent } from './navigation/navigation.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { PaymentComponent } from './payment/payment.component';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { WalletService } from './services/wallet.service';
import { LockComponent } from './lock/lock.component';
import { MatDialog, MatDialogModule, MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { LockConfirmDialog } from './lock/confirm-lock/confirm-lock.component';
import { UnLockComponent } from './lock/unlock/unlock.component';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { SeedEditDialog } from './main/edit-seed/seed-edit.component';
import { MatTableModule } from '@angular/material/table';
import { ConfigErrorComponent } from './lock/config-error/config-error.component';
import { NotifysComponent } from './notifys/notifys.component';
import { ConfirmDialog } from './core/confirm-dialog/confirm-dialog.component';
import { RevealSeedDialog } from './main/reveal-seed/reveal-seed.component';
import { ClipboardModule } from '@angular/cdk/clipboard';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { AuthInterceptor } from './services/auth-interceptor';
import { ApiService } from './services/api.service';
import { SettingsComponent } from './settings/settings.component';
import { BalanceComponent } from './balance/balance.component';
import { QRCodeModule } from 'angularx-qrcode';
import { QrReceiveDialog } from './main/qr-receive/qr-receive.component';
import { TranslocoRootModule } from './transloco-root.module';
import { LanguageChooserComponent } from './core/language-chooser/language-chooser.component';
import { WelcomeComponent } from './welcome/welcome.component';
import { UpdaterService } from './services/updater-service';


/** Http interceptor providers in outside-in order */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
];

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    NavigationComponent,
    PaymentComponent,
    LockComponent,
    LockConfirmDialog,
    UnLockComponent,
    SeedEditDialog,
    ConfigErrorComponent,
    NotifysComponent,
    ConfirmDialog,
    RevealSeedDialog,
    SettingsComponent,
    BalanceComponent,
    QrReceiveDialog,
    LanguageChooserComponent,
    WelcomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatSelectModule,
    MatRadioModule,
    MatCardModule,
    ReactiveFormsModule,
    LayoutModule,
    MatToolbarModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    BrowserAnimationsModule,
    MatDialogModule,
    MatSnackBarModule,
    MatTableModule,
    ClipboardModule,
    MatTooltipModule,
    HttpClientModule,
    QRCodeModule,
    TranslocoRootModule
  ],

  providers: [WalletService, AuthInterceptor, ApiService, UpdaterService, { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } },
    httpInterceptorProviders
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
