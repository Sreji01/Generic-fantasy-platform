import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PlayerResultRequest, PlayerResultResponse } from '../models/player-result.model';

@Injectable({ providedIn: 'root' })
export class PlayerResultService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/player-results`;

  getByRound(roundId: number): Observable<PlayerResultResponse[]> {
    const params = new HttpParams().set('roundId', roundId);
    return this.http.get<PlayerResultResponse[]>(this.baseUrl, { params });
  }

  create(request: PlayerResultRequest): Observable<PlayerResultResponse> {
    return this.http.post<PlayerResultResponse>(this.baseUrl, request);
  }

  update(id: number, request: PlayerResultRequest): Observable<PlayerResultResponse> {
    return this.http.put<PlayerResultResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
