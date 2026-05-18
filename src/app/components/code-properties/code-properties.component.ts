import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { VulnCase } from '../../models/vuln.models';

@Component({
  selector: 'app-code-properties',
  standalone: true,
  imports: [CommonModule, TranslateModule],
  templateUrl: './code-properties.component.html',
  styleUrls: ['./code-properties.component.scss']
})
export class CodePropertiesComponent {
  @Input() vulnCase!: VulnCase;
}
