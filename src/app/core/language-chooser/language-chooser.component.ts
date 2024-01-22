import { Component } from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import { TranslocoService } from '@ngneat/transloco';


@Component({
  selector: 'qli-language-chooser',
  templateUrl: './language-chooser.component.html',
  styleUrls: ['./language-chooser.component.scss']
})
export class LanguageChooserComponent {

  browserLanguage = navigator.language.split('-')[0]; 
  supportedLanguages: string[] = ['de', 'en', 'es', 'nl', 'ru'];
  selected: string;

  constructor(public translocoService: TranslocoService, public dialog: MatDialog){

    if (this.supportedLanguages.includes(this.browserLanguage)) {
      // Wenn ja, setze extractedLanguage als ausgewählte Sprache
      this.selected = this.browserLanguage;
    } else {
      // Wenn nicht, setze 'en' als ausgewählte Sprache
      this.selected = 'en';
    }

    this.translocoService.setActiveLang(this.selected);
  }

  changeLang(event:any ): void {
    this.translocoService.setActiveLang(event.value);
  }
 
}
