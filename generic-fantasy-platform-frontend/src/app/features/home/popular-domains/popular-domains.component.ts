import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { DomainService } from '../../../core/services/domain.service';
import { DomainResponse } from '../../../core/models/domain.model';
import { environment } from '../../../../environments/environment';

const MIN_TRACK_DURATION_SECONDS = 15;
const SECONDS_PER_DOMAIN = 4;

@Component({
  selector: 'app-popular-domains',
  standalone: true,
  imports: [],
  templateUrl: './popular-domains.component.html',
  styleUrl: './popular-domains.component.scss'
})
export class PopularDomainsComponent implements OnInit {
  private readonly domainService = inject(DomainService);
  private readonly router = inject(Router);

  readonly domains = signal<DomainResponse[]>([]);
  readonly popularDomains = computed(() => [...this.domains()].sort((a, b) => b.playerCount - a.playerCount));
  readonly loopDomains = computed(() => [...this.popularDomains(), ...this.popularDomains()]);
  readonly trackDuration = computed(
    () => `${Math.max(MIN_TRACK_DURATION_SECONDS, this.domains().length * SECONDS_PER_DOMAIN)}s`
  );

  ngOnInit(): void {
    this.domainService.getAll().subscribe((domains) => this.domains.set(domains));
  }

  posterUrl(domain: DomainResponse): string | null {
    return domain.thumbnailUrl ? `${environment.apiUrl}${domain.thumbnailUrl}` : null;
  }

  openDomain(domain: DomainResponse): void {
    this.router.navigateByUrl(`/domains/${domain.id}/field`);
  }
}
