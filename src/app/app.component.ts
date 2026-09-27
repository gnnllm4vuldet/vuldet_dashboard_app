import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { TopbarComponent } from './components/topbar/topbar.component';
import { VennDiagramComponent } from './components/venn-diagram/venn-diagram.component';
import { SectionViewComponent } from './components/section-view/section-view.component';
import { ChartStatsComponent } from './components/chart-stats/chart-stats.component';
import { GroundTruthFilterService } from './services/ground-truth-filter.service';
import { AnyVennSection } from './models/vuln.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, TranslateModule, TopbarComponent, VennDiagramComponent, SectionViewComponent, ChartStatsComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  activeSection: AnyVennSection | null = null;

  constructor(private groundTruthFilterService: GroundTruthFilterService) {}

  onSectionSelected(section: AnyVennSection): void {
    this.activeSection = section;
  }

  onBack(): void {
    this.activeSection = null;
    // Reset ground truth filter to default when going back to home
    this.groundTruthFilterService.reset();
  }
}
