import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { WalletService } from '../services/wallet.service';
import { firstValueFrom } from 'rxjs';

export const walletReadyGuard: CanActivateFn = (route, state) => {
  const walletService = inject(WalletService);
  const router: Router = inject(Router);
  return walletService.getLockUnlockRoute(router);
};
