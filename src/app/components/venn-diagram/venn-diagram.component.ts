import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { CaseSetService } from '../../services/case-set.service';
import { AnyVennSection, CaseSet } from '../../models/vuln.models';
import { CasesSwitcherComponent } from '../cases-switcher/cases-switcher.component';

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

/* ── Hardcoded geometry configs ──────────────────────────────────────── */

const NORMAL_CIRCLES: VennCircle[] = [
  { method: 'GNN',    cx: 185, cy: 195, r: 142, color: '#1e3db8', detected: 0, exclusive: 0, labelX: 64,  labelY: 128, section: 'gnn-only' },
  { method: 'Claude', cx: 340, cy: 150, r: 126, color: '#7c22b0', detected: 0, exclusive: 0, labelX: 374, labelY: 52,  section: 'claude-only' },
  { method: 'GPT-4o', cx: 382, cy: 308, r: 116, color: '#0a6e42', detected: 0, exclusive: 0, labelX: 460, labelY: 295, section: 'gpt-only' },
];

const NORMAL_INTERSECTIONS: VennIntersection[] = [
  { label: 'GNN∩Claude', count: 0, cx: 256, cy: 150, rx: 36, ry: 27, rotation: -18, color: '#4030a0', textX: 238, textY: 144, section: 'gnn-claude' },
  { label: 'Claude∩GPT', count: 0, cx: 358, cy: 232, rx: 32, ry: 25, rotation:  20, color: '#205868', textX: 340, textY: 226, section: 'claude-gpt' },
  { label: 'GNN∩GPT',   count: 0, cx: 270, cy: 274, rx: 28, ry: 22, rotation:   0, color: '#105848', textX: 252, textY: 268, section: 'gnn-gpt' },
];

const NORMAL_LEFT_SIDE: SideItem[] = [
  { method: 'GNN',    color: '#1e3db8', count: 0, section: 'gnn-only',    side: 'left' },
  { method: 'Claude', color: '#7c22b0', count: 0, section: 'claude-only', side: 'left' },
  { method: 'GPT-4o', color: '#0a6e42', count: 0, section: 'gpt-only',   side: 'left' },
];

const NORMAL_LEFT_INTERSECTIONS: IntersectItem[] = [
  { label: 'GNN ∩ Claude',    count: 0, section: 'gnn-claude' },
  { label: 'GNN ∩ GPT-4o',    count: 0, section: 'gnn-gpt' },
  { label: 'Claude ∩ GPT-4o', count: 0, section: 'claude-gpt' },
  { label: '', labelKey: 'VENN.ALL_CORRECT_LABEL', count: 0, section: 'all-three-correct' },
  { label: '', labelKey: 'VENN.ALL_WRONG_LABEL',   count: 0, section: 'all-three-wrong', color: '#c0392b' },
];

const MANUAL_CIRCLES: VennCircle[] = [
  { method: 'GNN',    cx: 200, cy: 230, r: 155, color: '#1e3db8', detected: 0, exclusive: 0, labelX: 72,  labelY: 172, section: 'gnn-only' },
  { method: 'Claude', cx: 360, cy: 230, r: 155, color: '#7c22b0', detected: 0, exclusive: 0, labelX: 380, labelY: 172, section: 'claude-only' },
];

const MANUAL_INTERSECTIONS: VennIntersection[] = [
  { label: 'GNN ∩ Claude', count: 0, cx: 280, cy: 230, rx: 72, ry: 120, rotation: 0, color: '#4030a0', textX: 258, textY: 224, section: 'both-correct' },
];

const MANUAL_LEFT_SIDE: SideItem[] = [
  { method: 'GNN',    color: '#1e3db8', count: 0, section: 'gnn-only',    side: 'left' },
  { method: 'Claude', color: '#7c22b0', count: 0, section: 'claude-only', side: 'left' },
];

const MANUAL_LEFT_INTERSECTIONS: IntersectItem[] = [
  { label: '', labelKey: 'VENN.BOTH_CORRECT_LABEL', count: 0, section: 'both-correct' },
  { label: '', labelKey: 'VENN.BOTH_WRONG_LABEL',   count: 0, section: 'both-wrong', color: '#c0392b' },
];

@Component({
  selector: 'app-venn-diagram',
  standalone: true,
  imports: [CommonModule, TranslateModule, CasesSwitcherComponent],
  templateUrl: './venn-diagram.component.html',
  styleUrls: ['./venn-diagram.component.scss']
})
export class VennDiagramComponent implements OnInit, OnDestroy {
  @Output() sectionSelected = new EventEmitter<AnyVennSection>();

  hoveredSection: AnyVennSection | null = null;
  isManualMode = false;

  /* Section counts loaded from data */
  private counts: Record<string, number> = {};
  private sub!: Subscription;

  /* Active display data (switched between normal/manual configs) */
  circles: VennCircle[] = [...NORMAL_CIRCLES];
  intersections: VennIntersection[] = [...NORMAL_INTERSECTIONS];
  leftSide: SideItem[] = [...NORMAL_LEFT_SIDE];
  leftIntersections: IntersectItem[] = [...NORMAL_LEFT_INTERSECTIONS];

  constructor(
    private dataService: DataService,
    private caseSetService: CaseSetService,
  ) {}

  ngOnInit(): void {
    this.sub = this.caseSetService.caseSet$.subscribe(caseSet => {
      this.isManualMode = caseSet === 'manual';
      this.loadData(caseSet);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  private loadData(caseSet: CaseSet): void {
    this.dataService.getVennSections(caseSet).subscribe(sections => {
      this.counts = {};
      sections.forEach(s => { this.counts[s.id] = s.count; });
      this.switchConfig(caseSet);
      this.applyCountsToCircles();
      this.applyCountsToIntersections();
      this.applyCountsToSidePanels();
    });
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
      'gnn-only':    ['gnn-only', 'gnn-claude', 'gnn-gpt', 'all-three-correct'],
      'claude-only': ['claude-only', 'gnn-claude', 'claude-gpt', 'all-three-correct'],
      'gpt-only':    ['gpt-only', 'gnn-gpt', 'claude-gpt', 'all-three-correct'],
    };
    const participatesManual: Partial<Record<AnyVennSection, AnyVennSection[]>> = {
      'gnn-only':    ['gnn-only', 'both-correct'],
      'claude-only': ['claude-only', 'both-correct'],
    };
    const map = this.isManualMode ? participatesManual : participatesNormal;
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

  get bothWrongCount(): number {
    return this.counts['both-wrong'] ?? 0;
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
}
