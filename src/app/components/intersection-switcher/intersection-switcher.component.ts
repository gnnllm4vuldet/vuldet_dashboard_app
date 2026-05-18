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
    'gnn-only', 'claude-only', 'gpt-only',
    'gnn-claude', 'gnn-gpt', 'claude-gpt',
    'all-three-correct', 'all-three-wrong',
  ];

  readonly manualSections: AnyVennSection[] = [
    'gnn-only', 'claude-only',
    'both-correct', 'both-wrong',
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
