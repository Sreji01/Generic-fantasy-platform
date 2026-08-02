import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { FantasyTeamRequest, FantasyTeamResponse } from '../models/fantasy-team.model';

@Injectable({ providedIn: 'root' })
export class FantasyTeamService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/fantasy-teams`;

  create(request: FantasyTeamRequest): Observable<FantasyTeamResponse> {
    return this.http.post<FantasyTeamResponse>(this.baseUrl, request);
  }
}
