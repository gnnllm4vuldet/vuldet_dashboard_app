import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CaseSet } from '../models/vuln.models';

@Injectable({ providedIn: 'root' })
export class CaseSetService {
  private state$ = new BehaviorSubject<CaseSet>('normal');

  readonly caseSet$ = this.state$.asObservable();

  get current(): CaseSet {
    return this.state$.value;
  }

  set(value: CaseSet): void {
    this.state$.next(value);
  }
}
