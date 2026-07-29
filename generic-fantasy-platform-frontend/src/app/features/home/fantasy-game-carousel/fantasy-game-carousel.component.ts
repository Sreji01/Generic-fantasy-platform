import { Component, ElementRef, Input, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { DomainResponse } from '../../../core/models/domain.model';
import { environment } from '../../../../environments/environment';

const MIN_TRACK_DURATION_SECONDS = 15;
const SECONDS_PER_DOMAIN = 4;

@Component({
  selector: 'app-domain-carousel',
  standalone: true,
  imports: [],
  templateUrl: './domain-carousel.component.html',
  styleUrl: './domain-carousel.component.scss'
})
export class DomainCarouselComponent implements OnDestroy {
  private readonly router = inject(Router);
  private resizeObserver?: ResizeObserver;

  @Input() emptyMessage = 'No domains yet.';
  @Input() alwaysScroll = true;

  @Input({ required: true })
  set domains(value: DomainResponse[]) {
    this.domainsSignal.set(value);
  }

  private readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>('viewport');
  private readonly domainsSignal = signal<DomainResponse[]>([]);

  // Plain (non-derived) signal: written imperatively from measureOverflow() after inspecting
  // the real DOM (scrollWidth vs clientWidth), never computed from shouldScroll()/displayDomains()
  // below — those two are doubled while scrolling, and dividing that back out would make this
  // signal depend on its own downstream consumers, which Angular rejects as a computed cycle.
  private readonly isOverflowingSignal = signal(false);

  readonly hasDomains = computed(() => this.domainsSignal().length > 0);
  readonly isOverflowing = this.isOverflowingSignal.asReadonly();
  readonly shouldScroll = computed(() => this.alwaysScroll || this.isOverflowing());
  readonly displayDomains = computed(() =>
    this.shouldScroll() ? [...this.domainsSignal(), ...this.domainsSignal()] : this.domainsSignal()
  );
  readonly trackDuration = computed(
    () => `${Math.max(MIN_TRACK_DURATION_SECONDS, this.domainsSignal().length * SECONDS_PER_DOMAIN)}s`
  );

  constructor() {
    // The viewport element only exists once `hasDomains()` is true, so the ResizeObserver is
    // (re)attached reactively whenever the queried element appears/disappears, and re-measured
    // whenever the domain list itself changes (e.g. a shorter list that now fits).
    effect(() => {
      const el = this.viewportRef()?.nativeElement;
      this.domainsSignal();

      this.resizeObserver?.disconnect();
      this.resizeObserver = undefined;

      if (!el) {
        this.isOverflowingSignal.set(false);
        return;
      }

      this.resizeObserver = new ResizeObserver(() => this.measureOverflow(el));
      this.resizeObserver.observe(el);
      this.measureOverflow(el);
    });
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  posterUrl(domain: DomainResponse): string | null {
    return domain.thumbnailUrl ? `${environment.apiUrl}${domain.thumbnailUrl}` : null;
  }

  openDomain(domain: DomainResponse): void {
    this.router.navigate(['/domains', domain.id]);
  }

  private measureOverflow(viewport: HTMLDivElement): void {
    // The track may currently be rendering a doubled (looping) copy of the cards, so divide
    // scrollWidth back down to a single copy's width before comparing it to the viewport.
    const domainCount = this.domainsSignal().length;
    const posterCount = viewport.querySelectorAll('.poster').length;
    const multiplier = domainCount > 0 && posterCount === domainCount * 2 ? 2 : 1;
    const singleCopyWidth = viewport.scrollWidth / multiplier;
    this.isOverflowingSignal.set(singleCopyWidth > viewport.clientWidth);
  }
}
