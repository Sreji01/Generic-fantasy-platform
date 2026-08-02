import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { PlayerResponse } from '../models/player.model';

@Injectable({ providedIn: 'root' })
export class PlayerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/players`;

  getAll(fantasyGameId?: number): Observable<PlayerResponse[]> {
    const params = fantasyGameId !== undefined ? new HttpParams().set('fantasyGameId', fantasyGameId) : undefined;
    return this.http.get<PlayerResponse[]>(this.baseUrl, { params });
  }
}
