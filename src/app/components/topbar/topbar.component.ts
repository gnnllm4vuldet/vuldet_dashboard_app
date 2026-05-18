import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})
export class TopbarComponent {
  langs = ['en', 'de', 'hu'];
  currentLang = 'en';

  constructor(private translate: TranslateService) {}

  setLang(lang: string): void {
    this.currentLang = lang;
    this.translate.use(lang);
  }
}
