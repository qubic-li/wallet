import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import {MediaMatcher} from '@angular/cdk/layout';
import { WalletService } from '../services/wallet.service';
import { ThemeService } from '../services/theme.service';
import { environment } from 'src/environments/environment';
import { UpdaterService } from '../services/updater-service';


@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrls: ['./navigation.component.scss']
})
export class NavigationComponent {

  @ViewChild("snav") snav: any;

  isHandset$: Observable<boolean> = this.breakpointObserver.observe(Breakpoints.Handset)
    .pipe(
      map(result => result.matches),
      shareReplay()
    );


  mobileQuery: MediaQueryList;
  title = 'qubic-li-wallet';
  public version = 0.0;


  private _mobileQueryListener: () => void;

  constructor(public us: UpdaterService, public themService: ThemeService, private breakpointObserver: BreakpointObserver, public walletService: WalletService, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    console.log("ENV", environment);
    this.version = environment.version;

  }


  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }

  checkMobileToggle() {
    if(this.mobileQuery.matches){
      this.snav.toggle();
    }
  }

}
