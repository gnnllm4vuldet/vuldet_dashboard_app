import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CaseSetService } from '../../services/case-set.service';

@Component({
  selector: 'app-cases-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './cases-switcher.component.html',
  styleUrls: ['./cases-switcher.component.scss']
})
export class CasesSwitcherComponent {
  isManual = false;

  constructor(private caseSetService: CaseSetService) {}

  onChange(): void {
    this.caseSetService.set(this.isManual ? 'manual' : 'normal');
  }
}
