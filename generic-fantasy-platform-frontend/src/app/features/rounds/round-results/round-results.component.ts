import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { PlayerService } from '../../../core/services/player.service';
import { PlayerResultService } from '../../../core/services/player-result.service';
import { RoundService } from '../../../core/services/round.service';
import { ScoreService } from '../../../core/services/score.service';
import { FantasyGameScoringRuleResponse } from '../../../core/models/fantasy-game-scoring-rule.model';
import { RoundResponse } from '../../../core/models/round.model';

interface PlayerResultRow {
  playerId: number;
  playerName: string;
  position: string;
  existingResultId: number | null;
  enabledRules: Record<string, boolean>;
}

@Component({
  selector: 'app-round-results',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatSlideToggleModule, MatTableModule, MatToolbarModule],
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
  readonly rules = signal<FantasyGameScoringRuleResponse[]>([]);
  readonly rows = signal<PlayerResultRow[]>([]);
  readonly displayedColumns = signal<string[]>([]);

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

  ruleAppliesTo(rule: FantasyGameScoringRuleResponse, position: string): boolean {
    return this.resolveRulePoints(rule, position) !== null;
  }

  resolveRulePoints(rule: FantasyGameScoringRuleResponse, position: string): number | null {
    if (!rule.variesByPosition) {
      return rule.points ?? 0;
    }
    const match = rule.positionValues.find((v) => v.positionName === position);
    return match ? match.points : null;
  }

  toggleRule(row: PlayerResultRow, ruleName: string): void {
    row.enabledRules[ruleName] = !row.enabledRules[ruleName];
  }

  rowPoints(row: PlayerResultRow): number {
    return this.rules().reduce((total, rule) => {
      if (!row.enabledRules[rule.name]) {
        return total;
      }
      const points = this.resolveRulePoints(rule, row.position);
      return total + (points ?? 0);
    }, 0);
  }

  saveRow(row: PlayerResultRow): void {
    const resultsJson = JSON.stringify(
      Object.fromEntries(this.rules().map((rule) => [rule.name, row.enabledRules[rule.name] ? 1 : 0]))
    );

    if (row.existingResultId != null) {
      this.playerResultService.update(row.existingResultId, { playerId: row.playerId, roundId: this.roundId, resultsJson }).subscribe({
        next: (updated) => {
          this.snackBar.open(`Result saved for ${row.playerName} (${updated.pointsEarned ?? 0} pts).`, 'Close', { duration: 2500 });
        },
        error: () => this.snackBar.open(`Failed to save result for ${row.playerName}.`, 'Close', { duration: 3000 })
      });
      return;
    }

    this.playerResultService.create({ playerId: row.playerId, roundId: this.roundId, resultsJson }).subscribe({
      next: (created) => {
        this.patchRow(row.playerId, { existingResultId: created.id });
        this.snackBar.open(`Result saved for ${row.playerName} (${created.pointsEarned ?? 0} pts).`, 'Close', { duration: 2500 });
      },
      error: () => this.snackBar.open(`Failed to save result for ${row.playerName}.`, 'Close', { duration: 3000 })
    });
  }

  saveAll(): void {
    const requests = this.rows().map((row) => {
      const resultsJson = JSON.stringify(
        Object.fromEntries(this.rules().map((rule) => [rule.name, row.enabledRules[rule.name] ? 1 : 0]))
      );
      return row.existingResultId != null
        ? this.playerResultService.update(row.existingResultId, { playerId: row.playerId, roundId: this.roundId, resultsJson })
        : this.playerResultService.create({ playerId: row.playerId, roundId: this.roundId, resultsJson });
    });

    if (requests.length === 0) {
      return;
    }

    forkJoin(requests).subscribe({
      next: (results) => {
        results.forEach((result, index) => {
          this.patchRow(this.rows()[index].playerId, { existingResultId: result.id });
        });
        this.snackBar.open('All results saved.', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to save all results.', 'Close', { duration: 4000 })
    });
  }

  private patchRow(playerId: number, changes: Partial<PlayerResultRow>): void {
    this.rows.update((rows) => rows.map((r) => (r.playerId === playerId ? { ...r, ...changes } : r)));
  }

  calculateScores(): void {
    this.scoreService.calculate(this.roundId).subscribe({
      next: () => this.snackBar.open('Scores calculated.', 'Close', { duration: 3000 }),
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
        const rules = fantasyGame.scoringRules;
        this.rules.set(rules);
        this.displayedColumns.set(['player', 'position', ...rules.map((r) => r.name), 'points', 'actions']);

        const resultByPlayerId = new Map(results.map((result) => [result.playerId, result]));

        this.rows.set(
          players.map((player) => {
            const existing = resultByPlayerId.get(player.id);
            const parsedStats: Record<string, number> = existing?.resultsJson ? JSON.parse(existing.resultsJson) : {};
            const enabledRules: Record<string, boolean> = {};
            for (const rule of rules) {
              enabledRules[rule.name] = Boolean(parsedStats[rule.name]);
            }
            return {
              playerId: player.id,
              playerName: `${player.firstName} ${player.lastName}`,
              position: player.position,
              existingResultId: existing?.id ?? null,
              enabledRules
            };
          })
        );
      });
    });
  }
}
