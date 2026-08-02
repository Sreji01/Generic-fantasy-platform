import { Component, OnInit, computed, inject, signal } from '@angular/core';

import { AuthService } from '../../../core/services/auth.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyGameCarouselComponent } from '../fantasy-game-carousel/fantasy-game-carousel.component';

@Component({
  selector: 'app-my-fantasy-games',
  standalone: true,
  imports: [FantasyGameCarouselComponent],
  templateUrl: './my-fantasy-games.component.html',
  styleUrl: './my-fantasy-games.component.scss'
})
export class MyFantasyGamesComponent implements OnInit {
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly authService = inject(AuthService);

  readonly fantasyGames = signal<FantasyGameResponse[]>([]);
  readonly myFantasyGames = computed(() => {
    const username = this.authService.currentUser()?.username;
    return this.fantasyGames().filter((fantasyGame) => fantasyGame.createdByUsername === username);
  });

  ngOnInit(): void {
    this.fantasyGameService.getAll().subscribe((fantasyGames) => this.fantasyGames.set(fantasyGames));
  }
}
