import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import hljs from 'highlight.js/lib/core';
import java from 'highlight.js/lib/languages/java';
import cpp from 'highlight.js/lib/languages/cpp';
import { VulnCase } from '../../models/vuln.models';

// Register languages once at module level (not per component instance)
hljs.registerLanguage('java', java);
hljs.registerLanguage('cpp', cpp);

@Component({
  selector: 'app-code-detail',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './code-detail.component.html',
  styleUrls: ['./code-detail.component.scss']
})
export class CodeDetailComponent implements OnChanges {
  @Input() vulnCase!: VulnCase;

  highlightedHtml: SafeHtml = '';
  codeLines: number[] = [];
  private vulnLineSet = new Set<number>();
  /** Source code with line endings normalized to plain \n */
  private normalizedSource = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    if (!this.vulnCase) return;
    // Normalize \r\n (Windows) and bare \r (classic Mac) to plain \n once,
    // so both the gutter and the highlighted HTML see exactly the same lines.
    this.normalizedSource = this.vulnCase.sourceCode
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n');
    this.vulnLineSet = new Set<number>(this.vulnCase.vulnerableLines ?? []);
    this.buildCodeLines();
    this.buildHighlightedHtml();
  }

  private buildCodeLines(): void {
    this.codeLines = this.normalizedSource.split('\n').map((_, i) => i + 1);
  }

  private buildHighlightedHtml(): void {
    const lang = this.highlightLang;
    let highlighted: string;

    try {
      highlighted = lang
        ? hljs.highlight(this.normalizedSource, { language: lang }).value
        : hljs.highlightAuto(this.normalizedSource).value;
    } catch {
      // Fallback: plain text with HTML entities escaped
      highlighted = this.escapeHtml(this.normalizedSource);
    }

    const lines = highlighted.split('\n');

    const html = lines
      .map((lineHtml, i) => {
        const cls = this.vulnLineSet.has(i + 1) ? 'code-line vuln-line' : 'code-line';
        return `<span class="${cls}">${lineHtml}\n</span>`;
      })
      .join('');

    this.highlightedHtml = this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  isVulnLine(lineNum: number): boolean {
    return this.vulnLineSet.has(lineNum);
  }

  get highlightLang(): string {
    switch (this.vulnCase?.language) {
      case 'Java':  return 'java';
      case 'C/C++': return 'cpp';
      default:      return '';
    }
  }
}
