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
    LLM:      'var(--gpt)',
    CodeBERT: 'var(--claude)',
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
      { name: 'GNN',      prediction: inferPrediction(c.GNN),      color: this.modelColors['GNN'],      isCorrect: c.GNN      === 'correct' },
      { name: 'LLM',      prediction: inferPrediction(c.LLM),      color: this.modelColors['LLM'],      isCorrect: c.LLM      === 'correct' },
      { name: 'CodeBERT', prediction: inferPrediction(c.CodeBERT), color: this.modelColors['CodeBERT'], isCorrect: c.CodeBERT === 'correct' },
    ];
  }

}
