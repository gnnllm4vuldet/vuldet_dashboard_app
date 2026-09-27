import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { TranslateModule } from '@ngx-translate/core';

interface Group {
  id: string;
  label: string;
}

interface Category {
  id: string;
  label: string;
  color: string;
}

interface ChartDef {
  id: string;
  title: string;
  categories: Category[];
  values: Record<string, Record<string, number>>;
}

interface ChartStats {
  groups: Group[];
  charts: ChartDef[];
}

interface Bar {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  color: string;
  category: string;
  group: string;
}

interface AxisTick {
  y: number;
  value: number;
}

interface GroupLayout {
  id: string;
  label: string;
  x: number;
  width: number;
}

@Component({
  selector: 'app-chart-stats',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './chart-stats.component.html',
  styleUrls: ['./chart-stats.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChartStatsComponent implements OnInit {
  data: ChartStats | null = null;
  selectedChartId = 'fix_size';
  hovered: Bar | null = null;
  mouseX = 0;
  mouseY = 0;

  /* viewBox geometry */
  readonly width = 960;
  readonly height = 360;
  readonly margin = { top: 16, right: 16, bottom: 64, left: 44 };

  bars: Bar[] = [];
  ticks: AxisTick[] = [];
  groupLayouts: GroupLayout[] = [];
  yMax = 0;

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.http.get<ChartStats>('assets/data/chart-stats.json').subscribe(d => {
      this.data = d;
      this.recompute();
      this.cdr.markForCheck();
    });
  }

  get selectedChart(): ChartDef | null {
    return this.data?.charts.find(c => c.id === this.selectedChartId) ?? null;
  }

  selectChart(id: string): void {
    this.selectedChartId = id;
    this.hovered = null;
    this.recompute();
  }

  private recompute(): void {
    const chart = this.selectedChart;
    if (!chart || !this.data) {
      this.bars = [];
      this.ticks = [];
      this.groupLayouts = [];
      return;
    }

    const innerW = this.width - this.margin.left - this.margin.right;
    const innerH = this.height - this.margin.top - this.margin.bottom;
    const groups = this.data.groups;

    /* y-axis: nice round max */
    let maxVal = 0;
    for (const g of groups) {
      for (const c of chart.categories) {
        maxVal = Math.max(maxVal, chart.values[g.id]?.[c.id] ?? 0);
      }
    }
    this.yMax = this.niceMax(maxVal);

    /* ticks */
    const tickCount = 5;
    this.ticks = [];
    for (let i = 0; i <= tickCount; i++) {
      const value = (this.yMax * i) / tickCount;
      const y = this.margin.top + innerH - (value / this.yMax) * innerH;
      this.ticks.push({ y, value: Math.round(value) });
    }

    /* group layout: split inner width across groups with gap */
    const groupGap = 24;
    const totalGap = groupGap * (groups.length - 1);
    const groupW = (innerW - totalGap) / groups.length;

    /* bars within a group */
    const barGap = 4;
    const cats = chart.categories;
    const barW = (groupW - barGap * (cats.length - 1)) / cats.length;

    this.bars = [];
    this.groupLayouts = [];

    groups.forEach((g, gi) => {
      const gx = this.margin.left + gi * (groupW + groupGap);
      this.groupLayouts.push({ id: g.id, label: g.label, x: gx, width: groupW });

      cats.forEach((c, ci) => {
        const value = chart.values[g.id]?.[c.id] ?? 0;
        const h = this.yMax > 0 ? (value / this.yMax) * innerH : 0;
        this.bars.push({
          x: gx + ci * (barW + barGap),
          y: this.margin.top + innerH - h,
          width: barW,
          height: h,
          value,
          color: c.color,
          category: c.label,
          group: g.label,
        });
      });
    });
  }

  private niceMax(v: number): number {
    if (v <= 0) return 5;
    const pow = Math.pow(10, Math.floor(Math.log10(v)));
    const norm = v / pow;
    let nice: number;
    if (norm <= 1) nice = 1;
    else if (norm <= 2) nice = 2;
    else if (norm <= 5) nice = 5;
    else nice = 10;
    return Math.ceil(v / (nice * pow / 5)) * (nice * pow / 5);
  }

  onBarEnter(bar: Bar, ev: MouseEvent): void {
    this.hovered = bar;
    this.updateMouse(ev);
  }

  onBarMove(ev: MouseEvent): void {
    this.updateMouse(ev);
  }

  onBarLeave(): void {
    this.hovered = null;
  }

  private updateMouse(ev: MouseEvent): void {
    const target = ev.currentTarget as SVGElement;
    const svg = target.ownerSVGElement;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    this.mouseX = ev.clientX - rect.left;
    this.mouseY = ev.clientY - rect.top;
  }

  /* axis baseline y */
  get baselineY(): number {
    return this.height - this.margin.bottom;
  }

  /* group label y */
  get groupLabelY(): number {
    return this.height - this.margin.bottom + 20;
  }

  trackChart = (_: number, c: ChartDef) => c.id;
  trackBar = (_: number, b: Bar) => `${b.group}-${b.category}`;
  trackCategory = (_: number, c: Category) => c.id;
  trackTick = (_: number, t: AxisTick) => t.value;
  trackGroup = (_: number, g: GroupLayout) => g.id;
}
