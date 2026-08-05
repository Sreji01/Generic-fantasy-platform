import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PlayerRequest, PlayerResponse } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/players`;

  getAll(fantasyGameId?: number): Observable<PlayerResponse[]> {
    const params = fantasyGameId !== undefined ? new HttpParams().set('fantasyGameId', fantasyGameId) : undefined;
    return this.http.get<PlayerResponse[]>(this.baseUrl, { params });
  }

  getById(id: number): Observable<PlayerResponse> {
    return this.http.get<PlayerResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: PlayerRequest): Observable<PlayerResponse> {
    return this.http.post<PlayerResponse>(this.baseUrl, request);
  }

  update(id: number, request: PlayerRequest): Observable<PlayerResponse> {
    return this.http.put<PlayerResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  uploadImage(id: number, file: File): Observable<PlayerResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<PlayerResponse>(`${this.baseUrl}/${id}/image`, formData);
  }
}
