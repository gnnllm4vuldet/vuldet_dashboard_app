import { Component, Input, OnChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { Highlight } from 'ngx-highlightjs';
import { VulnCase } from '../../models/vuln.models';

interface CodeLine {
  text: string;
}

@Component({
  selector: 'app-code-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule, Highlight],
  templateUrl: './code-detail.component.html',
  styleUrls: ['./code-detail.component.scss']
})
export class CodeDetailComponent implements OnChanges {
  @Input() vulnCase!: VulnCase;
  @ViewChild('codeEl', { read: ElementRef }) codeEl!: ElementRef<HTMLElement>;

  codeLines: CodeLine[] = [];
  private vulnLineSet = new Set<number>();

  ngOnChanges(): void {
    if (!this.vulnCase) return;
    this.vulnLineSet = new Set<number>(this.vulnCase.vulnerableLines ?? []);
    this.buildCodeLines();
    // Defer postprocessing so ngx-highlightjs has time to finish rendering
    // (it may highlight asynchronously) before we read and rewrite innerHTML.
    setTimeout(() => this.postProcessHighlight(), 0);
  }

  private buildCodeLines(): void {
    const lines = this.vulnCase.sourceCode.split('\n');
    this.codeLines = lines.map(text => ({ text }));
  }

  isVulnLine(lineNum: number): boolean {
    return this.vulnLineSet.has(lineNum);
  }

  private postProcessHighlight(): void {
    const el = this.codeEl?.nativeElement;
    if (!el) return;

    const rawHtml = el.innerHTML;
    // Guard: skip if empty or already post-processed
    if (!rawHtml || rawHtml.includes('code-line')) return;

    const lines = rawHtml.split('\n');
    const newHtml = lines.map((lineHtml, i) => {
      const lineNum = i + 1;
      const cls = this.vulnLineSet.has(lineNum)
        ? 'code-line vuln-line'
        : 'code-line';
      return `<span class="${cls}">${lineHtml}</span>`;
    }).join('');

    el.innerHTML = newHtml;
  }

  get highlightLang(): string {
    switch (this.vulnCase?.language) {
      case 'Java':   return 'java';
      case 'C/C++':  return 'cpp';
      default:       return '';
    }
  }
}
