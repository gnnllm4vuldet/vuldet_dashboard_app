import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { VulnCase } from '../../models/vuln.models';

@Component({
  selector: 'app-case-list',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './case-list.component.html',
  styleUrls: ['./case-list.component.scss']
})
export class CaseListComponent {
  @Input() cases: VulnCase[] = [];
  @Input() selectedCaseId: string | null = null;
  @Output() caseSelected = new EventEmitter<VulnCase>();

  select(c: VulnCase): void {
    this.caseSelected.emit(c);
  }

  isSelected(c: VulnCase): boolean {
    return c.id === this.selectedCaseId;
  }
}
