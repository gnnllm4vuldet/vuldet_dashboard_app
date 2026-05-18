import { Component, Input, Output, EventEmitter, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DataService } from '../../services/data.service';
import { CaseSetService } from '../../services/case-set.service';
import { AnyVennSection, VulnCase } from '../../models/vuln.models';
import { CaseListComponent } from '../case-list/case-list.component';
import { CodeDetailComponent } from '../code-detail/code-detail.component';
import { CodePropertiesComponent } from '../code-properties/code-properties.component';
import { ModelVerdictsComponent } from '../model-verdicts/model-verdicts.component';
import { IntersectionSwitcherComponent } from '../intersection-switcher/intersection-switcher.component';
import { GroundTruthFilterComponent, GroundTruthFilter } from '../ground-truth-filter/ground-truth-filter.component';

@Component({
  selector: 'app-section-view',
  standalone: true,
  imports: [CommonModule, TranslateModule, CaseListComponent, CodeDetailComponent, CodePropertiesComponent, ModelVerdictsComponent, IntersectionSwitcherComponent, GroundTruthFilterComponent],
  templateUrl: './section-view.component.html',
  styleUrls: ['./section-view.component.scss']
})
export class SectionViewComponent implements OnInit, OnChanges {
  @Input() section!: AnyVennSection;
  @Output() back = new EventEmitter<void>();

  activeSection!: AnyVennSection;
  groundTruthFilter: GroundTruthFilter = 'both';

  cases: VulnCase[] = [];
  selectedCase: VulnCase | null = null;
  loading = true;

  private readonly sectionColors: Record<string, string> = {
    'gnn-only':          '#1e3db8',
    'claude-only':       '#7c22b0',
    'gpt-only':          '#0a6e42',
    'gnn-claude':        '#4030a0',
    'claude-gpt':        '#205868',
    'gnn-gpt':           '#105848',
    'all-three-correct': '#1a1a1a',
    'all-three-wrong':   '#c0392b',
    'both-correct':      '#4030a0',
    'both-wrong':        '#c0392b',
  };

  private readonly sectionBg: Record<string, string> = {
    'gnn-only':          '#eef0ff',
    'claude-only':       '#f5eeff',
    'gpt-only':          '#e8faf2',
    'gnn-claude':        '#eeeaff',
    'claude-gpt':        '#e0f0f8',
    'gnn-gpt':           '#e0f0ee',
    'all-three-correct': '#f0f0ee',
    'all-three-wrong':   '#fff0ee',
    'both-correct':      '#eeeaff',
    'both-wrong':        '#fff0ee',
  };

  constructor(
    private dataService: DataService,
    private caseSetService: CaseSetService,
  ) {}

  ngOnInit(): void { this.loadCases(); }

  ngOnChanges(): void {
    this.activeSection = this.section;
    this.groundTruthFilter = 'both';
    this.selectedCase = null;
    this.loadCases();
  }

  private loadCases(): void {
    this.loading = true;
    this.dataService.getCases(this.activeSection, this.caseSetService.current).subscribe(cases => {
      this.cases = cases;
      this.loading = false;
    });
  }

  get filteredCases(): VulnCase[] {
    if (this.groundTruthFilter === 'both') return this.cases;
    return this.cases.filter(c => c.groundTruth === this.groundTruthFilter);
  }

  onSectionChange(section: AnyVennSection): void {
    this.activeSection = section;
    this.groundTruthFilter = 'both';
    this.selectedCase = null;
    this.loadCases();
  }

  onGroundTruthFilterChange(filter: GroundTruthFilter): void {
    this.groundTruthFilter = filter;
    this.selectedCase = null;
  }

  get badgeColor(): string  { return this.sectionColors[this.activeSection] ?? '#333'; }
  get badgeBg(): string     { return this.sectionBg[this.activeSection] ?? '#f5f5f0'; }
  get badgeBorder(): string { return `1px solid ${this.badgeColor}50`; }

  onCaseSelected(c: VulnCase): void { this.selectedCase = c; }
  onBack(): void { this.back.emit(); }
}
