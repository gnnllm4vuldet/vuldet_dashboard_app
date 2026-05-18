import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

export type GroundTruthFilter = 'both' | 'vulnerable' | 'secure';

@Component({
  selector: 'app-ground-truth-filter',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './ground-truth-filter.component.html',
  styleUrls: ['./ground-truth-filter.component.scss']
})
export class GroundTruthFilterComponent {
  @Input() value: GroundTruthFilter = 'both';
  @Output() filterChange = new EventEmitter<GroundTruthFilter>();

  readonly options: GroundTruthFilter[] = ['both', 'vulnerable', 'secure'];

  onSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as GroundTruthFilter;
    this.filterChange.emit(val);
  }
}
