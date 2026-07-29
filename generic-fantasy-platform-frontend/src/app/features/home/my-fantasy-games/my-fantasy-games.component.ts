import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { DomainService } from '../../../core/services/domain.service';
import { DomainResponse } from '../../../core/models/domain.model';
import { DomainCarouselComponent } from '../domain-carousel/domain-carousel.component';

@Component({
  selector: 'app-my-domains',
  standalone: true,
  imports: [DomainCarouselComponent],
  templateUrl: './my-domains.component.html',
  styleUrl: './my-domains.component.scss'
})
export class MyDomainsComponent implements OnInit {
  private readonly domainService = inject(DomainService);
  private readonly authService = inject(AuthService);

  readonly domains = signal<DomainResponse[]>([]);
  readonly myDomains = computed(() => {
    const username = this.authService.currentUser()?.username;
    return this.domains().filter((domain) => domain.createdByUsername === username);
  });

  ngOnInit(): void {
    this.domainService.getAll().subscribe((domains) => this.domains.set(domains));
  }
}
