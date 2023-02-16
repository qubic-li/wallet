import { Component } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';


@Component({
  selector: 'qli-language-chooser',
  templateUrl: './language-chooser.component.html',
  styleUrls: ['./language-chooser.component.scss']
})
export class LanguageChooserComponent {

  selected = 'en';

  constructor(public translocoService: TranslocoService, public dialog: MatDialog){
    
  }

  changeLang(event:any ): void {
    this.translocoService.setActiveLang(event.value);
  }
 
}
