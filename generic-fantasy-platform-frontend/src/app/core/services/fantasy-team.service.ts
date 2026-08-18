import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FantasyTeamRequest, FantasyTeamResponse, StandingEntry } from '../models/fantasy-team.model';

@Injectable({ providedIn: 'root' })
export class FantasyTeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fantasy-teams`;

  getAll(filters?: { leagueId?: number; fantasyGameId?: number }): Observable<FantasyTeamResponse[]> {
    let params = new HttpParams();
    if (filters?.leagueId !== undefined) {
      params = params.set('leagueId', filters.leagueId);
    }
    if (filters?.fantasyGameId !== undefined) {
      params = params.set('fantasyGameId', filters.fantasyGameId);
    }
    return this.http.get<FantasyTeamResponse[]>(this.baseUrl, { params });
  }

  getMine(fantasyGameId?: number): Observable<FantasyTeamResponse[]> {
    const params = fantasyGameId !== undefined ? new HttpParams().set('fantasyGameId', fantasyGameId) : undefined;
    return this.http.get<FantasyTeamResponse[]>(`${this.baseUrl}/me`, { params });
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

  joinLeague(teamId: number, leagueId: number, code?: string): Observable<FantasyTeamResponse> {
    const params = code ? new HttpParams().set('code', code) : undefined;
    return this.http.post<FantasyTeamResponse>(`${this.baseUrl}/${teamId}/leagues/${leagueId}`, {}, { params });
  }

  leaveLeague(teamId: number, leagueId: number): Observable<FantasyTeamResponse> {
    return this.http.delete<FantasyTeamResponse>(`${this.baseUrl}/${teamId}/leagues/${leagueId}`);
  }
}
