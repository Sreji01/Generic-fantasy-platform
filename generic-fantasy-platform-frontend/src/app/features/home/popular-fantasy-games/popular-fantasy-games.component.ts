import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyGameCarouselComponent } from '../fantasy-game-carousel/fantasy-game-carousel.component';

@Component({
  selector: 'app-popular-fantasy-games',
  standalone: true,
  imports: [FantasyGameCarouselComponent],
  templateUrl: './popular-fantasy-games.component.html',
  styleUrl: './popular-fantasy-games.component.scss'
})
export class PopularFantasyGamesComponent implements OnInit {
  private readonly fantasyGameService = inject(FantasyGameService);

  readonly fantasyGames = signal<FantasyGameResponse[]>([]);
  readonly popularFantasyGames = computed(() => [...this.fantasyGames()].sort((a, b) => b.playerCount - a.playerCount));

  ngOnInit(): void {
    this.fantasyGameService.getAll().subscribe((fantasyGames) => this.fantasyGames.set(fantasyGames));
  }
}
