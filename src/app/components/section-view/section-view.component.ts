import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { CaseSetService } from '../../services/case-set.service';
import { GroundTruthFilterService, GroundTruthFilter } from '../../services/ground-truth-filter.service';
import { AnyVennSection, VulnCase } from '../../models/vuln.models';
import { CaseListComponent } from '../case-list/case-list.component';
import { CodeDetailComponent } from '../code-detail/code-detail.component';
import { CodePropertiesComponent } from '../code-properties/code-properties.component';
import { ModelVerdictsComponent } from '../model-verdicts/model-verdicts.component';
import { IntersectionSwitcherComponent } from '../intersection-switcher/intersection-switcher.component';
import { GroundTruthFilterComponent } from '../ground-truth-filter/ground-truth-filter.component';

@Component({
  selector: 'app-section-view',
  standalone: true,
  imports: [CommonModule, TranslateModule, CaseListComponent, CodeDetailComponent, CodePropertiesComponent, ModelVerdictsComponent, IntersectionSwitcherComponent, GroundTruthFilterComponent],
  templateUrl: './section-view.component.html',
  styleUrls: ['./section-view.component.scss']
})
export class SectionViewComponent implements OnInit, OnChanges, OnDestroy {
  @Input() section!: AnyVennSection;
  @Output() back = new EventEmitter<void>();

  activeSection!: AnyVennSection;
  groundTruthFilter: GroundTruthFilter = 'both';

  cases: VulnCase[] = [];
  selectedCase: VulnCase | null = null;
  loading = true;
  caseListCollapsed = false;

  private filterSub!: Subscription;

  private readonly sectionColors: Record<string, string> = {
    'gnn-only':          '#1e3db8',  // Blue
    'llm-only':          '#7c22b0',  // Purple
    'codebert-only':     '#0a6e42',  // Green
    'gnn-llm':           '#4030a0',  // Blue-Purple
    'llm-codebert':      '#3d5a4a',  // Purple-Green
    'gnn-codebert':      '#105848',  // Blue-Green
    'all-three-correct': '#1a1a1a',  // Dark
    'all-three-wrong':   '#c0392b',  // Red
  };

  private readonly sectionBg: Record<string, string> = {
    'gnn-only':          '#eef0ff',
    'llm-only':          '#f5eeff',
    'codebert-only':     '#e8faf2',
    'gnn-llm':           '#eeeaff',
    'llm-codebert':      '#e0f0f8',
    'gnn-codebert':      '#e0f0ee',
    'all-three-correct': '#f0f0ee',
    'all-three-wrong':   '#fff0ee',
  };

  constructor(
    private dataService: DataService,
    private caseSetService: CaseSetService,
    private groundTruthFilterService: GroundTruthFilterService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to ground truth filter changes
    this.filterSub = this.groundTruthFilterService.filter$.subscribe(filter => {
      this.groundTruthFilter = filter;
      this.selectedCase = null;
      this.cdr.markForCheck();
    });
    
    this.loadCases();
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  ngOnChanges(): void {
    this.activeSection = this.section;
    // Don't reset groundTruthFilter here - it's managed by the service
    this.selectedCase = null;
    this.loadCases();
  }

  private loadCases(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.dataService.getCases(this.activeSection, this.caseSetService.current).subscribe({
      next: (cases) => {
        console.log('Cases loaded:', cases.length, 'for section:', this.activeSection);
        this.cases = cases;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading cases:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  get filteredCases(): VulnCase[] {
    if (this.groundTruthFilter === 'both') return this.cases;
    return this.cases.filter(c => c.groundTruth === this.groundTruthFilter);
  }

  onSectionChange(section: AnyVennSection): void {
    this.activeSection = section;
    // Don't reset groundTruthFilter here - it's managed by the service
    this.selectedCase = null;
    this.loadCases();
  }

  onGroundTruthFilterChange(filter: GroundTruthFilter): void {
    this.groundTruthFilterService.setFilter(filter);
    this.selectedCase = null;
  }

  get badgeColor(): string  { return this.sectionColors[this.activeSection] ?? '#333'; }
  get badgeBg(): string     { return this.sectionBg[this.activeSection] ?? '#f5f5f0'; }
  get badgeBorder(): string { return `1px solid ${this.badgeColor}50`; }

  onCaseSelected(c: VulnCase): void { 
    this.selectedCase = c;
    // Collapse case list on mobile after selection
    if (window.innerWidth <= 768) {
      this.caseListCollapsed = true;
    }
  }
  
  toggleCaseList(): void {
    this.caseListCollapsed = !this.caseListCollapsed;
  }
  
  onBack(): void { this.back.emit(); }
}
