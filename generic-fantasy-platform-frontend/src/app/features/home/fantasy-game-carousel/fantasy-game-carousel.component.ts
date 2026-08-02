import { Component, ElementRef, Input, OnDestroy, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { environment } from '../../../../environments/environment';

const MIN_TRACK_DURATION_SECONDS = 15;
const SECONDS_PER_FANTASY_GAME = 4;

@Component({
  selector: 'app-fantasy-game-carousel',
  standalone: true,
  imports: [],
  templateUrl: './fantasy-game-carousel.component.html',
  styleUrl: './fantasy-game-carousel.component.scss'
})
export class FantasyGameCarouselComponent implements OnDestroy {
  private readonly router = inject(Router);
  private resizeObserver?: ResizeObserver;

  @Input() emptyMessage = 'No fantasy games yet.';
  @Input() alwaysScroll = true;

  @Input({ required: true })
  set fantasyGames(value: FantasyGameResponse[]) {
    this.fantasyGamesSignal.set(value);
  }

  private readonly viewportRef = viewChild<ElementRef<HTMLDivElement>>('viewport');
  private readonly fantasyGamesSignal = signal<FantasyGameResponse[]>([]);

  // Plain (non-derived) signal: written imperatively from measureOverflow() after inspecting
  // the real DOM (scrollWidth vs clientWidth), never computed from shouldScroll()/displayFantasyGames()
  // below — those two are doubled while scrolling, and dividing that back out would make this
  // signal depend on its own downstream consumers, which Angular rejects as a computed cycle.
  private readonly isOverflowingSignal = signal(false);

  readonly hasFantasyGames = computed(() => this.fantasyGamesSignal().length > 0);
  readonly isOverflowing = this.isOverflowingSignal.asReadonly();
  readonly shouldScroll = computed(() => this.alwaysScroll || this.isOverflowing());
  readonly displayFantasyGames = computed(() =>
    this.shouldScroll() ? [...this.fantasyGamesSignal(), ...this.fantasyGamesSignal()] : this.fantasyGamesSignal()
  );
  readonly trackDuration = computed(
    () => `${Math.max(MIN_TRACK_DURATION_SECONDS, this.fantasyGamesSignal().length * SECONDS_PER_FANTASY_GAME)}s`
  );

  constructor() {
    // The viewport element only exists once `hasFantasyGames()` is true, so the ResizeObserver is
    // (re)attached reactively whenever the queried element appears/disappears, and re-measured
    // whenever the fantasyGame list itself changes (e.g. a shorter list that now fits).
    effect(() => {
      const el = this.viewportRef()?.nativeElement;
      this.fantasyGamesSignal();

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

  posterUrl(fantasyGame: FantasyGameResponse): string | null {
    return fantasyGame.thumbnailUrl ? `${environment.apiUrl}${fantasyGame.thumbnailUrl}` : null;
  }

  openFantasyGame(fantasyGame: FantasyGameResponse): void {
    this.router.navigate(['/fantasy-games', fantasyGame.id]);
  }

  private measureOverflow(viewport: HTMLDivElement): void {
    // The track may currently be rendering a doubled (looping) copy of the cards, so divide
    // scrollWidth back down to a single copy's width before comparing it to the viewport.
    const fantasyGameCount = this.fantasyGamesSignal().length;
    const posterCount = viewport.querySelectorAll('.poster').length;
    const multiplier = fantasyGameCount > 0 && posterCount === fantasyGameCount * 2 ? 2 : 1;
    const singleCopyWidth = viewport.scrollWidth / multiplier;
    this.isOverflowingSignal.set(singleCopyWidth > viewport.clientWidth);
  }
}
