import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { VulnCase } from '../../models/vuln.models';

interface ModelVerdict {
  name: string;
  prediction: 'vulnerable' | 'secure';
  color: string;
  isCorrect: boolean;
}

@Component({
  selector: 'app-model-verdicts',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './model-verdicts.component.html',
  styleUrls: ['./model-verdicts.component.scss']
})
export class ModelVerdictsComponent implements OnChanges {
  @Input() vulnCase!: VulnCase;

  verdicts: ModelVerdict[] = [];

  private readonly modelColors: Record<string, string> = {
    GNN:      'var(--gnn)',
    'GPT-4o': 'var(--gpt)',
    Claude:   'var(--claude)',
  };

  ngOnChanges(): void {
    if (!this.vulnCase) return;
    this.buildVerdicts();
  }

  private buildVerdicts(): void {
    const c = this.vulnCase;
    const inferPrediction = (result: 'wrong' | 'correct'): 'vulnerable' | 'secure' => {
      if (result === 'correct') return c.groundTruth;
      return c.groundTruth === 'vulnerable' ? 'secure' : 'vulnerable';
    };
    this.verdicts = [
      { name: 'GNN',    prediction: inferPrediction(c.gnn),    color: this.modelColors['GNN'],    isCorrect: c.gnn    === 'correct' },
      { name: 'GPT-4o', prediction: inferPrediction(c.gpt),    color: this.modelColors['GPT-4o'], isCorrect: c.gpt    === 'correct' },
      { name: 'Claude', prediction: inferPrediction(c.claude), color: this.modelColors['Claude'], isCorrect: c.claude === 'correct' },
    ];
  }

}
