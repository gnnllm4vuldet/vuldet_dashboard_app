import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { AnyVennSection } from '../../models/vuln.models';
import { CaseSetService } from '../../services/case-set.service';

@Component({
  selector: 'app-intersection-switcher',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './intersection-switcher.component.html',
  styleUrls: ['./intersection-switcher.component.scss']
})
export class IntersectionSwitcherComponent implements OnInit, OnDestroy {
  @Input() activeSection!: AnyVennSection;
  @Output() sectionChange = new EventEmitter<AnyVennSection>();

  private sub!: Subscription;
  isManual = false;

  readonly normalSections: AnyVennSection[] = [
    'gnn-only', 'llm-only', 'codebert-only',
    'gnn-llm', 'gnn-codebert', 'llm-codebert',
    'all-three-correct', 'all-three-wrong',
  ];

  // Manual evaluation now uses the same 3-model sections as the normal dataset
  readonly manualSections: AnyVennSection[] = [
    'gnn-only', 'llm-only', 'codebert-only',
    'gnn-llm', 'gnn-codebert', 'llm-codebert',
    'all-three-correct', 'all-three-wrong',
  ];

  get sections(): AnyVennSection[] {
    return this.isManual ? this.manualSections : this.normalSections;
  }

  constructor(private caseSetService: CaseSetService) {}

  ngOnInit(): void {
    this.sub = this.caseSetService.caseSet$.subscribe(cs => {
      this.isManual = cs === 'manual';
    });
  }

  ngOnDestroy(): void { this.sub?.unsubscribe(); }

  onSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as AnyVennSection;
    this.sectionChange.emit(val);
  }
}
