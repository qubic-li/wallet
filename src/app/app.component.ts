import { ChangeDetectorRef, Component } from '@angular/core';
import {MediaMatcher} from '@angular/cdk/layout';
import { ApiService } from './services/api.service';
import { DeviceDetectorService } from 'ngx-device-detector';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  mobileQuery: MediaQueryList;
  title = 'qubic-li-wallet';

  private deviceInfo;
  public isMobile = false;
  public isDesktop = false;
  private _mobileQueryListener: () => void;

  constructor(public themeService: ThemeService, changeDetectorRef: ChangeDetectorRef, media: MediaMatcher, api: ApiService, private deviceService: DeviceDetectorService) {
    this.mobileQuery = media.matchMedia('(max-width: 600px)');
    this._mobileQueryListener = () => changeDetectorRef.detectChanges();
    this.mobileQuery.addListener(this._mobileQueryListener);
    this.deviceInfo = this.deviceService.getDeviceInfo();
    this.isMobile = this.deviceService.isMobile();
    this.isDesktop = this.deviceService.isDesktop();
  }


  ngOnDestroy(): void {
    this.mobileQuery.removeListener(this._mobileQueryListener);
  }
}
