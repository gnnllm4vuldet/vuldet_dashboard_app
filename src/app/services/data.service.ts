import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VulnCase, ModelMetrics, VennSectionMeta, AnyVennSection, CaseSet } from '../models/vuln.models';

@Injectable({ providedIn: 'root' })
export class DataService {
  constructor(private http: HttpClient) {}

  getCases(section: AnyVennSection, caseSet: CaseSet = 'normal'): Observable<VulnCase[]> {
    const file = caseSet === 'manual'
      ? 'assets/data/cases_manual.json'
      : 'assets/data/cases.json';
    return this.http.get<Record<string, VulnCase[]>>(file).pipe(
      map(data => data[section] ?? [])
    );
  }

  getAllCases(caseSet: CaseSet = 'normal'): Observable<Record<string, VulnCase[]>> {
    const file = caseSet === 'manual'
      ? 'assets/data/cases_manual.json'
      : 'assets/data/cases.json';
    return this.http.get<Record<string, VulnCase[]>>(file);
  }

  getMetrics(): Observable<ModelMetrics[]> {
    return this.http.get<{ metrics: ModelMetrics[] }>('assets/data/metrics.json').pipe(
      map(d => d.metrics)
    );
  }

  getVennSections(caseSet: CaseSet = 'normal'): Observable<VennSectionMeta[]> {
    const key = caseSet === 'manual' ? 'vennSectionsManual' : 'vennSections';
    return this.http.get<Record<string, VennSectionMeta[]>>('assets/data/metrics.json').pipe(
      map(d => d[key] ?? [])
    );
  }
}
