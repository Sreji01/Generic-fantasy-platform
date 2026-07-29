import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { DomainService } from '../../../core/services/domain.service';
import { DomainResponse } from '../../../core/models/domain.model';
import { DomainCarouselComponent } from '../domain-carousel/domain-carousel.component';

@Component({
  selector: 'app-popular-domains',
  standalone: true,
  imports: [DomainCarouselComponent],
  templateUrl: './popular-domains.component.html',
  styleUrl: './popular-domains.component.scss'
})
export class PopularDomainsComponent implements OnInit {
  private readonly domainService = inject(DomainService);

  readonly domains = signal<DomainResponse[]>([]);
  readonly popularDomains = computed(() => [...this.domains()].sort((a, b) => b.playerCount - a.playerCount));

  ngOnInit(): void {
    this.domainService.getAll().subscribe((domains) => this.domains.set(domains));
  }
}
