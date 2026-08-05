import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { PlayerService } from '../../../core/services/player.service';
import { PlayerResultService } from '../../../core/services/player-result.service';
import { RoundService } from '../../../core/services/round.service';
import { ScoreService } from '../../../core/services/score.service';
import { RoundResponse } from '../../../core/models/round.model';
import { ScoreResponse } from '../../../core/models/score.model';

interface PlayerResultRow {
  playerId: number;
  playerName: string;
  position: string;
  existingResultId: number | null;
  stats: Record<string, number | null>;
  pointsEarned: number | null;
}

@Component({
  selector: 'app-round-results',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatIconModule, MatInputModule, MatTableModule, MatToolbarModule],
  templateUrl: './round-results.component.html',
  styleUrl: './round-results.component.scss'
})
export class RoundResultsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roundService = inject(RoundService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly playerService = inject(PlayerService);
  private readonly playerResultService = inject(PlayerResultService);
  private readonly scoreService = inject(ScoreService);
  private readonly snackBar = inject(MatSnackBar);

  private roundId!: number;

  readonly round = signal<RoundResponse | null>(null);
  readonly ruleNames = signal<string[]>([]);
  readonly rows = signal<PlayerResultRow[]>([]);
  readonly scores = signal<ScoreResponse[] | null>(null);
  readonly displayedColumns = signal<string[]>([]);
  readonly scoreColumns = ['fantasyTeamName', 'points'];

  ngOnInit(): void {
    this.roundId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  goBack(): void {
    const fantasyGameId = this.round()?.fantasyGameId;
    if (fantasyGameId) {
      this.router.navigate(['/fantasy-games', fantasyGameId, 'rounds']);
    } else {
      this.router.navigateByUrl('/home');
    }
  }

  saveRow(row: PlayerResultRow): void {
    const resultsJson = JSON.stringify(
      Object.fromEntries(Object.entries(row.stats).map(([key, value]) => [key, value ?? 0]))
    );

    if (row.existingResultId != null) {
      this.playerResultService.update(row.existingResultId, { playerId: row.playerId, roundId: this.roundId, resultsJson }).subscribe({
        next: (updated) => {
          this.patchRow(row.playerId, { pointsEarned: updated.pointsEarned });
          this.snackBar.open(`Result saved for ${row.playerName}.`, 'Close', { duration: 2500 });
        },
        error: () => this.snackBar.open(`Failed to save result for ${row.playerName}.`, 'Close', { duration: 3000 })
      });
      return;
    }

    this.playerResultService.create({ playerId: row.playerId, roundId: this.roundId, resultsJson }).subscribe({
      next: (created) => {
        this.patchRow(row.playerId, { existingResultId: created.id, pointsEarned: created.pointsEarned });
        this.snackBar.open(`Result saved for ${row.playerName}.`, 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open(`Failed to save result for ${row.playerName}.`, 'Close', { duration: 3000 })
    });
  }

  private patchRow(playerId: number, changes: Partial<PlayerResultRow>): void {
    this.rows.update((rows) => rows.map((r) => (r.playerId === playerId ? { ...r, ...changes } : r)));
  }

  calculateScores(): void {
    this.scoreService.calculate(this.roundId).subscribe({
      next: (scores) => {
        this.scores.set(scores);
        this.snackBar.open('Scores calculated.', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to calculate scores. You may not have permission.', 'Close', { duration: 4000 })
    });
  }

  private load(): void {
    this.roundService.getById(this.roundId).subscribe((round) => {
      this.round.set(round);

      forkJoin({
        fantasyGame: this.fantasyGameService.getById(round.fantasyGameId),
        players: this.playerService.getAll(round.fantasyGameId),
        results: this.playerResultService.getByRound(this.roundId)
      }).subscribe(({ fantasyGame, players, results }) => {
        const ruleNames = fantasyGame.scoringRules.map((rule) => rule.name);
        this.ruleNames.set(ruleNames);
        this.displayedColumns.set(['player', 'position', ...ruleNames, 'pointsEarned', 'actions']);

        const resultByPlayerId = new Map(results.map((result) => [result.playerId, result]));

        this.rows.set(
          players.map((player) => {
            const existing = resultByPlayerId.get(player.id);
            const parsedStats: Record<string, number> = existing?.resultsJson ? JSON.parse(existing.resultsJson) : {};
            const stats: Record<string, number | null> = {};
            for (const ruleName of ruleNames) {
              stats[ruleName] = parsedStats[ruleName] ?? 0;
            }
            return {
              playerId: player.id,
              playerName: `${player.firstName} ${player.lastName}`,
              position: player.position,
              existingResultId: existing?.id ?? null,
              stats,
              pointsEarned: existing?.pointsEarned ?? null
            };
          })
        );
      });

      this.scoreService.getByRound(this.roundId).subscribe((scores) => {
        if (scores.length > 0) {
          this.scores.set(scores);
        }
      });
    });
  }
}
