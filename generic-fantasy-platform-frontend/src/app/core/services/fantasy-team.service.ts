import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FantasyTeamRequest, FantasyTeamResponse, StandingEntry } from '../models/fantasy-team.model';

@Injectable({ providedIn: 'root' })
export class FantasyTeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fantasy-teams`;

  getAll(leagueId?: number): Observable<FantasyTeamResponse[]> {
    const params = leagueId !== undefined ? new HttpParams().set('leagueId', leagueId) : undefined;
    return this.http.get<FantasyTeamResponse[]>(this.baseUrl, { params });
  }

  getMine(): Observable<FantasyTeamResponse[]> {
    return this.http.get<FantasyTeamResponse[]>(`${this.baseUrl}/me`);
  }

  getStandings(leagueId: number): Observable<StandingEntry[]> {
    const params = new HttpParams().set('leagueId', leagueId);
    return this.http.get<StandingEntry[]>(`${this.baseUrl}/standings`, { params });
  }

  getById(id: number): Observable<FantasyTeamResponse> {
    return this.http.get<FantasyTeamResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: FantasyTeamRequest): Observable<FantasyTeamResponse> {
    return this.http.post<FantasyTeamResponse>(this.baseUrl, request);
  }

  update(id: number, request: FantasyTeamRequest): Observable<FantasyTeamResponse> {
    return this.http.put<FantasyTeamResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
