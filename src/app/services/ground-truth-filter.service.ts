import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type GroundTruthFilter = 'both' | 'vulnerable' | 'secure';

@Injectable({
  providedIn: 'root'
})
export class GroundTruthFilterService {
  private filterSubject = new BehaviorSubject<GroundTruthFilter>('both');
  
  public filter$: Observable<GroundTruthFilter> = this.filterSubject.asObservable();

  get current(): GroundTruthFilter {
    return this.filterSubject.value;
  }

  setFilter(filter: GroundTruthFilter): void {
    this.filterSubject.next(filter);
  }

  reset(): void {
    this.filterSubject.next('both');
  }
}
