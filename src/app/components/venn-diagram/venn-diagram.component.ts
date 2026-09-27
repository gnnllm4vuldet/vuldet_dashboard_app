import { Component, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { CaseSetService } from '../../services/case-set.service';
import { GroundTruthFilterService, GroundTruthFilter } from '../../services/ground-truth-filter.service';
import { AnyVennSection, CaseSet } from '../../models/vuln.models';
import { CasesSwitcherComponent } from '../cases-switcher/cases-switcher.component';
import { GroundTruthFilterComponent } from '../ground-truth-filter/ground-truth-filter.component';

interface VennCircle {
  method: string;
  cx: number;
  cy: number;
  r: number;
  color: string;
  detected: number;
  exclusive: number;
  labelX: number;
  labelY: number;
  section: AnyVennSection;
}

interface VennIntersection {
  label: string;
  count: number;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rotation: number;
  color: string;
  textX: number;
  textY: number;
  section: AnyVennSection;
}

interface SideItem {
  method: string;
  color: string;
  count: number;
  section: AnyVennSection;
  side: 'left' | 'right';
}

interface IntersectItem {
  label: string;
  labelKey?: string;
  count: number;
  section: AnyVennSection;
  color?: string;
}

interface PerformanceMetric {
  model: string;
  fpr: number;
  fnr: number;
  precision: number;
  recall: number;
  f1Score: number;
  accuracy: number;
  mcc: number;
  section?: AnyVennSection;
}

/* ── Hardcoded geometry configs ──────────────────────────────────────── */

const NORMAL_CIRCLES: VennCircle[] = [
  { method: 'GNN',      cx: 185, cy: 195, r: 142, color: '#1e3db8', detected: 0, exclusive: 0, labelX: 64,  labelY: 128, section: 'gnn-only' },
  { method: 'LLM',      cx: 340, cy: 150, r: 126, color: '#7c22b0', detected: 0, exclusive: 0, labelX: 374, labelY: 52,  section: 'llm-only' },
  { method: 'CodeBERT', cx: 382, cy: 308, r: 116, color: '#0a6e42', detected: 0, exclusive: 0, labelX: 460, labelY: 295, section: 'codebert-only' },
];

const NORMAL_INTERSECTIONS: VennIntersection[] = [
  { label: 'GNN∩LLM',      count: 0, cx: 256, cy: 150, rx: 36, ry: 27, rotation: -18, color: '#4030a0', textX: 238, textY: 144, section: 'gnn-llm' },
  { label: 'LLM∩CodeBERT', count: 0, cx: 358, cy: 232, rx: 32, ry: 25, rotation:  20, color: '#205868', textX: 340, textY: 226, section: 'llm-codebert' },
  { label: 'GNN∩CodeBERT', count: 0, cx: 270, cy: 274, rx: 28, ry: 22, rotation:   0, color: '#105848', textX: 252, textY: 268, section: 'gnn-codebert' },
];

const NORMAL_LEFT_SIDE: SideItem[] = [
  { method: 'GNN',      color: '#1e3db8', count: 0, section: 'gnn-only',      side: 'left' },
  { method: 'LLM',      color: '#7c22b0', count: 0, section: 'llm-only',      side: 'left' },
  { method: 'CodeBERT', color: '#0a6e42', count: 0, section: 'codebert-only', side: 'left' },
];

const NORMAL_LEFT_INTERSECTIONS: IntersectItem[] = [
  { label: 'GNN ∩ LLM',          count: 0, section: 'gnn-llm' },
  { label: 'GNN ∩ CodeBERT',     count: 0, section: 'gnn-codebert' },
  { label: 'LLM ∩ CodeBERT',     count: 0, section: 'llm-codebert' },
  { label: '', labelKey: 'VENN.ALL_CORRECT_LABEL', count: 0, section: 'all-three-correct' },
  { label: '', labelKey: 'VENN.ALL_WRONG_LABEL',   count: 0, section: 'all-three-wrong', color: '#c0392b' },
];

// Manual evaluation now uses the same 3-model structure — reuse normal configs
const MANUAL_CIRCLES          = NORMAL_CIRCLES;
const MANUAL_INTERSECTIONS     = NORMAL_INTERSECTIONS;
const MANUAL_LEFT_SIDE         = NORMAL_LEFT_SIDE;
const MANUAL_LEFT_INTERSECTIONS = NORMAL_LEFT_INTERSECTIONS;

@Component({
  selector: 'app-venn-diagram',
  standalone: true,
  imports: [CommonModule, TranslateModule, CasesSwitcherComponent, GroundTruthFilterComponent],
  templateUrl: './venn-diagram.component.html',
  styleUrls: ['./venn-diagram.component.scss']
})
export class VennDiagramComponent implements OnInit, OnDestroy {
  @Output() sectionSelected = new EventEmitter<AnyVennSection>();

  hoveredSection: AnyVennSection | null = null;
  isManualMode = false;
  isLoading = false;
  groundTruthFilter: GroundTruthFilter = 'both';

  /* Section counts loaded from data */
  private counts: Record<string, number> = {};
  private currentCaseSet: CaseSet = 'normal';
  private caseSetSub!: Subscription;
  private filterSub!: Subscription;

  /* Active display data (switched between normal/manual configs) */
  circles: VennCircle[] = [...NORMAL_CIRCLES];
  intersections: VennIntersection[] = [...NORMAL_INTERSECTIONS];
  leftSide: SideItem[] = [...NORMAL_LEFT_SIDE];
  leftIntersections: IntersectItem[] = [...NORMAL_LEFT_INTERSECTIONS];

  /* Performance metrics table data */
  allMetrics: PerformanceMetric[] = [
    { model: 'GNN',      fpr: 0.1167, fnr: 0.4567, precision: 0.8232, recall: 0.5433, f1Score: 0.6546, accuracy: 0.7133, mcc: 0.4537, section: 'gnn-only' },
    { model: 'LLM',      fpr: 0.1867, fnr: 0.1967, precision: 0.8114, recall: 0.8033, f1Score: 0.8074, accuracy: 0.8083, mcc: 0.6167, section: 'llm-only' },
    { model: 'CodeBERT', fpr: 0.1333, fnr: 0.5000, precision: 0.7895, recall: 0.5000, f1Score: 0.6122, accuracy: 0.6833, mcc: 0.3941, section: 'codebert-only' },
    { model: 'GNN AND LLM',      fpr: 0.0267, fnr: 0.5633, precision: 0.9424, recall: 0.4367, f1Score: 0.5968, accuracy: 0.7050, mcc: 0.4859, section: 'gnn-llm' },
    { model: 'GNN OR LLM',       fpr: 0.2767, fnr: 0.0900, precision: 0.7669, recall: 0.9100, f1Score: 0.8323, accuracy: 0.8167, mcc: 0.6447 },
    { model: 'GNN AND CodeBERT', fpr: 0.0233, fnr: 0.7100, precision: 0.9255, recall: 0.2900, f1Score: 0.4416, accuracy: 0.6333, mcc: 0.3668, section: 'gnn-codebert' },
    { model: 'GNN OR CodeBERT',  fpr: 0.2267, fnr: 0.2467, precision: 0.7687, recall: 0.7533, f1Score: 0.7609, accuracy: 0.7633, mcc: 0.5268 },
    { model: 'LLM AND CodeBERT', fpr: 0.0433, fnr: 0.6000, precision: 0.9023, recall: 0.4000, f1Score: 0.5543, accuracy: 0.6783, mcc: 0.4293, section: 'llm-codebert' },
    { model: 'LLM OR CodeBERT',  fpr: 0.2767, fnr: 0.0967, precision: 0.7655, recall: 0.9033, f1Score: 0.8287, accuracy: 0.8133, mcc: 0.6371 },
    { model: 'All three AND',    fpr: 0.0100, fnr: 0.7700, precision: 0.9583, recall: 0.2300, f1Score: 0.3710, accuracy: 0.6100, mcc: 0.3385 },
    { model: 'All three OR',     fpr: 0.3533, fnr: 0.0500, precision: 0.7289, recall: 0.9500, f1Score: 0.8249, accuracy: 0.7983, mcc: 0.6262 },
  ];

  performanceMetrics: PerformanceMetric[] = [...this.allMetrics];
  sortColumn: string | null = null;
  sortDirection: 'asc' | 'desc' = 'asc';

  // Cache for best/worst values to avoid recalculation
  private bestWorstCache: Map<string, { best: number; worst: number }> = new Map();

  constructor(
    private dataService: DataService,
    private caseSetService: CaseSetService,
    private groundTruthFilterService: GroundTruthFilterService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // Pre-calculate best/worst values once on init
    this.calculateBestWorstCache();
    
    // Subscribe to case set changes
    this.caseSetSub = this.caseSetService.caseSet$.subscribe(caseSet => {
      this.isManualMode = caseSet === 'manual';
      this.currentCaseSet = caseSet;
      this.loadData(caseSet);
    });

    // Subscribe to ground truth filter changes
    this.filterSub = this.groundTruthFilterService.filter$.subscribe(filter => {
      this.groundTruthFilter = filter;
      this.loadData(this.currentCaseSet);
    });
  }

  ngOnDestroy(): void {
    this.caseSetSub?.unsubscribe();
    this.filterSub?.unsubscribe();
  }

  onGroundTruthFilterChange(filter: GroundTruthFilter): void {
    this.groundTruthFilterService.setFilter(filter);
  }

  private loadData(caseSet: CaseSet): void {
    this.isLoading = true;

    if (this.groundTruthFilter === 'both') {
      this.dataService.getVennSections(caseSet).subscribe({
        next: (sections) => {
          this.counts = {};
          sections.forEach(s => { this.counts[s.id] = s.count; });
          this.applyCounts(caseSet);
        },
        error: (err) => {
          console.error('Error loading venn sections:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      const filter = this.groundTruthFilter;
      this.dataService.getAllCases(caseSet).subscribe({
        next: (allCases) => {
          this.counts = {};
          Object.keys(allCases).forEach(section => {
            this.counts[section] = allCases[section].filter(c => c.groundTruth === filter).length;
          });
          this.applyCounts(caseSet);
        },
        error: (err) => {
          console.error('Error loading cases for venn filter:', err);
          this.isLoading = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  private applyCounts(caseSet: CaseSet): void {
    this.switchConfig(caseSet);
    this.applyCountsToCircles();
    this.applyCountsToIntersections();
    this.applyCountsToSidePanels();
    this.isLoading = false;
    this.cdr.markForCheck();
  }

  private switchConfig(caseSet: CaseSet): void {
    if (caseSet === 'manual') {
      this.circles           = MANUAL_CIRCLES.map(c => ({ ...c }));
      this.intersections     = MANUAL_INTERSECTIONS.map(i => ({ ...i }));
      this.leftSide          = MANUAL_LEFT_SIDE.map(s => ({ ...s }));
      this.leftIntersections = MANUAL_LEFT_INTERSECTIONS.map(i => ({ ...i }));
    } else {
      this.circles           = NORMAL_CIRCLES.map(c => ({ ...c }));
      this.intersections     = NORMAL_INTERSECTIONS.map(i => ({ ...i }));
      this.leftSide          = NORMAL_LEFT_SIDE.map(s => ({ ...s }));
      this.leftIntersections = NORMAL_LEFT_INTERSECTIONS.map(i => ({ ...i }));
    }
  }

  private applyCountsToCircles(): void {
    this.circles = this.circles.map(c => {
      const exclusive = this.counts[c.section] ?? 0;
      const detected  = this.calcDetected(c.section);
      return { ...c, exclusive, detected };
    });
  }

  private calcDetected(section: AnyVennSection): number {
    const participatesNormal: Partial<Record<AnyVennSection, AnyVennSection[]>> = {
      'gnn-only':      ['gnn-only', 'gnn-llm', 'gnn-codebert', 'all-three-correct'],
      'llm-only':      ['llm-only', 'gnn-llm', 'llm-codebert', 'all-three-correct'],
      'codebert-only': ['codebert-only', 'gnn-codebert', 'llm-codebert', 'all-three-correct'],
    };
    const map = participatesNormal;
    return (map[section] ?? []).reduce((sum, s) => sum + (this.counts[s] ?? 0), 0);
  }

  private applyCountsToIntersections(): void {
    this.intersections = this.intersections.map(i => ({
      ...i, count: this.counts[i.section] ?? 0,
    }));
  }

  private applyCountsToSidePanels(): void {
    this.leftSide          = this.leftSide.map(s => ({ ...s, count: this.counts[s.section] ?? 0 }));
    this.leftIntersections = this.leftIntersections.map(i => ({ ...i, count: this.counts[i.section] ?? 0 }));
  }

  get allCorrectCount(): number {
    return this.counts['all-three-correct'] ?? 0;
  }

  get allWrongCount(): number {
    return this.counts['all-three-wrong'] ?? 0;
  }

  get bothWrongCount(): number {
    return this.counts['all-three-wrong'] ?? 0;
  }

  getTransform(int: VennIntersection): string {
    return `rotate(${int.rotation},${int.cx},${int.cy})`;
  }

  isHovered(section: AnyVennSection): boolean {
    return this.hoveredSection === section;
  }

  onHover(section: AnyVennSection): void {
    this.hoveredSection = section;
  }

  onLeave(): void {
    this.hoveredSection = null;
  }

  select(section: AnyVennSection): void {
    this.sectionSelected.emit(section);
  }

  /* Sorting functionality */
  sortBy(column: string): void {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }

    this.performanceMetrics = [...this.allMetrics].sort((a, b) => {
      const aVal = this.getMetricValue(a, column) ?? 0;
      const bVal = this.getMetricValue(b, column) ?? 0;
      
      const comparison = aVal - bVal;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  getSortIcon(column: string): string {
    if (this.sortColumn !== column) return '↕';
    return this.sortDirection === 'asc' ? '↑' : '↓';
  }

  isSingleModel(metric: PerformanceMetric): boolean {
    return metric.model === 'GNN' || metric.model === 'LLM' || metric.model === 'CodeBERT';
  }

  isCombinedModel(metric: PerformanceMetric): boolean {
    return !this.isSingleModel(metric);
  }

  /* Pre-calculate best/worst values for performance */
  private calculateBestWorstCache(): void {
    const columns = ['fpr', 'fnr', 'precision', 'recall', 'f1Score', 'accuracy', 'mcc'];
    const groups = [true, false]; // true = single models, false = combined models

    for (const isSingle of groups) {
      for (const column of columns) {
        const groupValues = this.allMetrics
          .filter(m => this.isSingleModel(m) === isSingle)
          .map(m => this.getMetricValue(m, column))
          .filter(v => v !== null) as number[];

        if (groupValues.length > 0) {
          const key = `${isSingle ? 'single' : 'combined'}-${column}`;
          this.bestWorstCache.set(key, {
            best: Math.max(...groupValues),
            worst: Math.min(...groupValues)
          });
        }
      }
    }
  }

  /* Helper methods for highlighting best/worst values */
  getCellClass(metric: PerformanceMetric, column: string): string {
    const value = this.getMetricValue(metric, column);
    if (value === null) return '';

    const isSingle = this.isSingleModel(metric);
    const cacheKey = `${isSingle ? 'single' : 'combined'}-${column}`;
    const cached = this.bestWorstCache.get(cacheKey);
    
    if (!cached) return '';

    // For FPR and FNR, lower is better (so swap best/worst)
    if (column === 'fpr' || column === 'fnr') {
      if (value === cached.worst) return 'best-value';
      if (value === cached.best) return 'worst-value';
    } else {
      // For other metrics, higher is better
      if (value === cached.best) return 'best-value';
      if (value === cached.worst) return 'worst-value';
    }

    return '';
  }

  private getMetricValue(metric: PerformanceMetric, column: string): number | null {
    switch (column) {
      case 'fpr': return metric.fpr;
      case 'fnr': return metric.fnr;
      case 'precision': return metric.precision;
      case 'recall': return metric.recall;
      case 'f1Score': return metric.f1Score;
      case 'accuracy': return metric.accuracy;
      case 'mcc': return metric.mcc;
      default: return null;
    }
  }
}
