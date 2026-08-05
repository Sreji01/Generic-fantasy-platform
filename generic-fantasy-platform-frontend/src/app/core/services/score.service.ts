import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ScoreResponse } from '../models/score.model';

@Injectable({ providedIn: 'root' })
export class ScoreService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/scores`;

  getByRound(roundId: number): Observable<ScoreResponse[]> {
    const params = new HttpParams().set('roundId', roundId);
    return this.http.get<ScoreResponse[]>(this.baseUrl, { params });
  }

  calculate(roundId: number): Observable<ScoreResponse[]> {
    return this.http.post<ScoreResponse[]>(`${this.baseUrl}/calculate/${roundId}`, {});
  }
}
