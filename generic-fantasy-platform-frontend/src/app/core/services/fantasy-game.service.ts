import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FantasyGameRequest, FantasyGameResponse } from '../models/fantasy-game.model';

@Injectable({ providedIn: 'root' })
export class FantasyGameService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fantasy-games`;

  getAll(): Observable<FantasyGameResponse[]> {
    return this.http.get<FantasyGameResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<FantasyGameResponse> {
    return this.http.get<FantasyGameResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: FantasyGameRequest): Observable<FantasyGameResponse> {
    return this.http.post<FantasyGameResponse>(this.baseUrl, request);
  }

  update(id: number, request: FantasyGameRequest): Observable<FantasyGameResponse> {
    return this.http.put<FantasyGameResponse>(`${this.baseUrl}/${id}`, request);
  }

  uploadBackgroundImage(id: number, file: File): Observable<FantasyGameResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FantasyGameResponse>(`${this.baseUrl}/${id}/background-image`, formData);
  }

  uploadBenchBackgroundImage(id: number, file: File): Observable<FantasyGameResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FantasyGameResponse>(`${this.baseUrl}/${id}/bench-background-image`, formData);
  }

  uploadThumbnailImage(id: number, file: File): Observable<FantasyGameResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FantasyGameResponse>(`${this.baseUrl}/${id}/thumbnail-image`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
