import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { RoundRequest, RoundResponse } from '../models/round.model';

@Injectable({ providedIn: 'root' })
export class RoundService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/rounds`;

  getAll(fantasyGameId?: number): Observable<RoundResponse[]> {
    const params = fantasyGameId !== undefined ? new HttpParams().set('fantasyGameId', fantasyGameId) : undefined;
    return this.http.get<RoundResponse[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<RoundResponse> {
    return this.http.get<RoundResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: RoundRequest): Observable<RoundResponse> {
    return this.http.post<RoundResponse>(this.baseUrl, request);
  }

  update(id: number, request: RoundRequest): Observable<RoundResponse> {
    return this.http.put<RoundResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
