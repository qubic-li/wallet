import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs/internal/BehaviorSubject';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class UpdaterService {

  public currentTick: BehaviorSubject<number> = new BehaviorSubject(0);

  constructor(private api: ApiService) {
    this.getCurrentTick();
    setInterval(() => this.getCurrentTick(), 10000);
  }

  private getCurrentTick() {
    // todo: Use Websocket!
    return this.api.getCurrentTick().subscribe(r => {
      if (r && r.tick) {
        this.currentTick.next(r.tick);
        
      }
    });
  }

  forceUpdateCurrentTick() {
    this.getCurrentTick();
  }

}
