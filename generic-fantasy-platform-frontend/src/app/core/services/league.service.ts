import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { LeagueRequest, LeagueResponse } from '../models/league.model';

@Injectable({ providedIn: 'root' })
export class LeagueService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/leagues`;

  getAll(): Observable<LeagueResponse[]> {
    return this.http.get<LeagueResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<LeagueResponse> {
    return this.http.get<LeagueResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: LeagueRequest): Observable<LeagueResponse> {
    return this.http.post<LeagueResponse>(this.baseUrl, request);
  }

  update(id: number, request: LeagueRequest): Observable<LeagueResponse> {
    return this.http.put<LeagueResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
