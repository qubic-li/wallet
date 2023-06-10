import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BalanceComponent } from './balance/balance.component';
import { MainComponent } from './main/main.component';
import { SettingsComponent } from './settings/settings.component';
import { PaymentComponent } from './payment/payment.component';
import { VotingComponent } from './voting/voting.component';
import { VotingParticipateComponent } from './voting/participate/voting-participate.component';
import { VotingCreateComponent } from './voting/create/voting-create.component';

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
    path     : 'voting',
    component: VotingComponent
  },
  {
    path     : 'voting/create',
    component: VotingCreateComponent
  },
  {
    path     : 'voting/create/:computorId',
    component: VotingCreateComponent
  },
  {
    path     : 'voting/participate/:index',
    component: VotingParticipateComponent
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
