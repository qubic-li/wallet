import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BalanceComponent } from './balance/balance.component';
import { MainComponent } from './main/main.component';
import { SettingsComponent } from './settings/settings.component';
import { PaymentComponent } from './payment/payment.component';

const routes: Routes = [
  {
    path     : '',
    component: MainComponent
  },
  {
    path     : 'payment',
    component: PaymentComponent
  },
  {
    path     : 'payment/:receiverId',
    component: PaymentComponent
  },
  {
    path     : 'payment/:receiverId/:amount',
    component: PaymentComponent
  },
  {
    path     : 'balance',
    component: BalanceComponent
  },
  {
    path     : 'settings',
    component: SettingsComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
