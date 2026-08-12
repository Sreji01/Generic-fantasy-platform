import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { LeagueService } from '../../../core/services/league.service';
import { RoundService } from '../../../core/services/round.service';
import { FantasyGameRequest, FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyTeamResponse } from '../../../core/models/fantasy-team.model';
import { LeagueRequest, LeagueResponse } from '../../../core/models/league.model';
import { FantasyGameFormDialogComponent } from '../fantasy-game-form-dialog/fantasy-game-form-dialog.component';
import { LeagueFormDialogComponent } from '../../leagues/league-form-dialog/league-form-dialog.component';
import { SelectTeamDialogComponent } from '../../leagues/select-team-dialog/select-team-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-fantasy-game-details',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatToolbarModule, MatTooltipModule],
  templateUrl: './fantasy-game-details.component.html',
  styleUrl: './fantasy-game-details.component.scss'
})
export class FantasyGameDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly leagueService = inject(LeagueService);
  private readonly roundService = inject(RoundService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private fantasyGameId!: number;

  readonly fantasyGame = signal<FantasyGameResponse | null>(null);
  readonly myTeams = signal<FantasyTeamResponse[]>([]);
  readonly leagues = signal<LeagueResponse[]>([]);
  readonly popularLeagues = computed(() => [...this.leagues()].sort((a, b) => b.participantCount - a.participantCount));
  readonly transfersLocked = signal(false);

  readonly canBypassLock = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  readonly backgroundDisplayUrl = computed(() => {
    const url = this.fantasyGame()?.backgroundImageUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly cellSize = 90;
  readonly gridRows = computed(() => Array.from({ length: this.fantasyGame()?.fieldRows ?? 0 }, (_, i) => i));
  readonly gridCols = computed(() => Array.from({ length: this.fantasyGame()?.fieldCols ?? 0 }, (_, i) => i));

  readonly canManage = computed(() => {
    const user = this.authService.currentUser();
    const fantasyGame = this.fantasyGame();
    if (!user || !fantasyGame) {
      return false;
    }
    return user.role === 'ADMIN' || user.username === fantasyGame.createdByUsername;
  });

  ngOnInit(): void {
    this.fantasyGameId = Number(this.route.snapshot.paramMap.get('id'));
    this.fantasyGameService.getById(this.fantasyGameId).subscribe((fantasyGame) => this.fantasyGame.set(fantasyGame));
    this.loadLeagues();
    this.loadMyTeams();
    this.roundService.getAll(this.fantasyGameId).subscribe((rounds) => this.transfersLocked.set(rounds.some((r) => r.status === 'ACTIVE')));
  }

  cellAt(row: number, col: number): { positionName: string; slotNumber: number } | null {
    const fantasyGame = this.fantasyGame();
    if (!fantasyGame) {
      return null;
    }
    for (const position of fantasyGame.positions) {
      const index = position.slots.findIndex((s) => s.rowIndex === row && s.colIndex === col);
      if (index !== -1) {
        return { positionName: position.name, slotNumber: index + 1 };
      }
    }
    return null;
  }

  manageField(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId, 'field']);
  }

  managePlayers(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId, 'players']);
  }

  manageRounds(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId, 'rounds']);
  }

  viewStandings(league: LeagueResponse): void {
    this.router.navigate(['/leagues', league.id, 'standings']);
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  openEditDialog(): void {
    const fantasyGame = this.fantasyGame();
    if (!fantasyGame) {
      return;
    }

    const ref = this.dialog.open(FantasyGameFormDialogComponent, { data: fantasyGame, width: '600px', maxWidth: '600px' });

    ref.afterClosed().subscribe((result: FantasyGameRequest | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyGameService.update(fantasyGame.id, result).subscribe({
        next: (updated) => {
          this.fantasyGame.set(updated);
          this.snackBar.open('Fantasy Game updated.', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to update fantasy game. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteFantasyGame(): void {
    const fantasyGame = this.fantasyGame();
    if (!fantasyGame) {
      return;
    }

    this.confirmDialog
      .confirm({ title: 'Delete Fantasy Game', message: `Delete fantasy game "${fantasyGame.name}"?` })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.fantasyGameService.delete(fantasyGame.id).subscribe({
          next: () => {
            this.snackBar.open('Fantasy Game deleted.', 'Close', { duration: 3000 });
            this.location.back();
          },
          error: () => this.snackBar.open('Failed to delete fantasy game. You may not have permission.', 'Close', { duration: 4000 })
        });
      });
  }

  openCreateLeagueDialog(): void {
    this.promptCreateLeague();
  }

  createTeam(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId, 'team-builder']);
  }

  viewTeam(team: FantasyTeamResponse): void {
    this.router.navigate(['/fantasy-teams', team.id]);
  }

  joinLeague(league: LeagueResponse): void {
    this.fantasyTeamService.getMine(this.fantasyGameId).subscribe((teams) => {
      const eligibleTeams = teams.filter((t) => !t.leagues.some((l) => l.id === league.id));

      if (eligibleTeams.length === 0) {
        this.goCreateTeamFor(league);
        return;
      }

      if (eligibleTeams.length === 1) {
        this.joinWithTeam(eligibleTeams[0].id, league);
        return;
      }

      const ref = this.dialog.open(SelectTeamDialogComponent, {
        data: { teams: eligibleTeams, leagueName: league.name },
        width: '420px'
      });
      ref.afterClosed().subscribe((result) => {
        if (!result) {
          return;
        }
        if (result === 'new') {
          this.goCreateTeamFor(league);
          return;
        }
        this.joinWithTeam(result.id, league);
      });
    });
  }

  private joinWithTeam(teamId: number, league: LeagueResponse): void {
    this.fantasyTeamService.joinLeague(teamId, league.id).subscribe({
      next: () => {
        this.snackBar.open('Joined league.', 'Close', { duration: 3000 });
        this.loadLeagues();
        this.loadMyTeams();
      },
      error: (err) => {
        const message = err?.error?.message ?? 'Failed to join league.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  private goCreateTeamFor(league: LeagueResponse): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId, 'team-builder'], {
      queryParams: { joinLeagueId: league.id }
    });
  }

  private promptCreateLeague(onCreated?: (league: LeagueResponse) => void): void {
    const ref = this.dialog.open(LeagueFormDialogComponent, { data: { fantasyGameId: this.fantasyGameId }, width: '480px' });

    ref.afterClosed().subscribe((result: LeagueRequest | undefined) => {
      if (!result) {
        return;
      }
      this.leagueService.create(result).subscribe({
        next: (created) => {
          this.snackBar.open('League created.', 'Close', { duration: 3000 });
          this.loadLeagues();
          onCreated?.(created);
        },
        error: () => this.snackBar.open('Failed to create league.', 'Close', { duration: 3000 })
      });
    });
  }

  private loadLeagues(): void {
    this.leagueService.getAll(this.fantasyGameId).subscribe((leagues) => this.leagues.set(leagues));
  }

  private loadMyTeams(): void {
    this.fantasyTeamService.getMine(this.fantasyGameId).subscribe((teams) => this.myTeams.set(teams));
  }
}
