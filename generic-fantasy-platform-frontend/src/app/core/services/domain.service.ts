import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import { DomainRequest, DomainResponse } from '../models/domain.model';

@Injectable({ providedIn: 'root' })
export class DomainService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/domains`;

  getAll(): Observable<DomainResponse[]> {
    return this.http.get<DomainResponse[]>(this.baseUrl);
  }

  getById(id: number): Observable<DomainResponse> {
    return this.http.get<DomainResponse>(`${this.baseUrl}/${id}`);
  }

  create(request: DomainRequest): Observable<DomainResponse> {
    return this.http.post<DomainResponse>(this.baseUrl, request);
  }

  update(id: number, request: DomainRequest): Observable<DomainResponse> {
    return this.http.put<DomainResponse>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
