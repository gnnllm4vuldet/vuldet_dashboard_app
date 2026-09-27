import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { VulnCase, ModelMetrics, VennSectionMeta, AnyVennSection, CaseSet } from '../models/vuln.models';

@Injectable({ providedIn: 'root' })
export class DataService {
  private casesCache = new Map<string, Observable<Record<string, VulnCase[]>>>();
  private metricsCache: Observable<Record<string, any>> | null = null;

  constructor(private http: HttpClient) {}

  getCases(section: AnyVennSection, caseSet: CaseSet = 'normal'): Observable<VulnCase[]> {
    return this.getAllCases(caseSet).pipe(
      map(data => data[section] ?? [])
    );
  }

  getAllCases(caseSet: CaseSet = 'normal'): Observable<Record<string, VulnCase[]>> {
    const file = caseSet === 'manual'
      ? 'assets/data/cases_manual.json'
      : 'assets/data/cases.json';

    if (!this.casesCache.has(file)) {
      this.casesCache.set(
        file,
        this.http.get<Record<string, VulnCase[]>>(file).pipe(shareReplay(1))
      );
    }

    return this.casesCache.get(file)!;
  }

  getMetrics(): Observable<ModelMetrics[]> {
    return this.getMetricsFile().pipe(
      map(d => d['metrics'] ?? [])
    );
  }

  getVennSections(caseSet: CaseSet = 'normal'): Observable<VennSectionMeta[]> {
    const key = caseSet === 'manual' ? 'vennSectionsManual' : 'vennSections';
    return this.getMetricsFile().pipe(
      map(d => d[key] ?? [])
    );
  }

  private getMetricsFile(): Observable<Record<string, any>> {
    if (!this.metricsCache) {
      this.metricsCache = this.http.get<Record<string, any>>('assets/data/metrics.json').pipe(
        shareReplay(1)
      );
    }
    return this.metricsCache;
  }
}
