import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
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
import { PlayerService } from '../../../core/services/player.service';
import { RoundService } from '../../../core/services/round.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyTeamRequest, FantasyTeamResponse } from '../../../core/models/fantasy-team.model';
import { LeagueResponse } from '../../../core/models/league.model';
import { PlayerResponse } from '../../../core/models/player.model';
import { JoinLeagueDialogComponent, JoinLeagueDialogData } from '../../leagues/join-league-dialog/join-league-dialog.component';
import { environment } from '../../../../environments/environment';

interface SlotRef {
  row: number;
  col: number;
  positionName: string;
  player: PlayerResponse | null;
}

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatToolbarModule, MatTooltipModule],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly leagueService = inject(LeagueService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly playerService = inject(PlayerService);
  private readonly roundService = inject(RoundService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private teamId!: number;

  readonly team = signal<FantasyTeamResponse | null>(null);
  readonly league = signal<LeagueResponse | null>(null);
  readonly fantasyGame = signal<FantasyGameResponse | null>(null);
  readonly rosterPlayers = signal<PlayerResponse[]>([]);
  readonly transfersLocked = signal(false);

  readonly backgroundDisplayUrl = computed(() => {
    const url = this.fantasyGame()?.backgroundImageUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly cellSize = 70;
  readonly gridRows = computed(() => Array.from({ length: this.fantasyGame()?.fieldRows ?? 0 }, (_, i) => i));
  readonly gridCols = computed(() => Array.from({ length: this.fantasyGame()?.fieldCols ?? 0 }, (_, i) => i));

  readonly slots = computed<SlotRef[]>(() => {
    const fantasyGame = this.fantasyGame();
    if (!fantasyGame) {
      return [];
    }
    const remainingByPosition = new Map<string, PlayerResponse[]>();
    for (const player of this.rosterPlayers()) {
      const list = remainingByPosition.get(player.position) ?? [];
      list.push(player);
      remainingByPosition.set(player.position, list);
    }

    const result: SlotRef[] = [];
    for (const position of fantasyGame.positions) {
      const remaining = remainingByPosition.get(position.name) ?? [];
      for (const slot of position.slots) {
        result.push({
          row: slot.rowIndex,
          col: slot.colIndex,
          positionName: position.name,
          player: remaining.shift() ?? null
        });
      }
      remainingByPosition.set(position.name, remaining);
    }
    return result;
  });

  readonly benchPlayers = computed<PlayerResponse[]>(() => {
    const assignedIds = new Set(this.slots().map((s) => s.player?.id).filter((id): id is number => id != null));
    return this.rosterPlayers().filter((p) => !assignedIds.has(p.id));
  });

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'ADMIN');

  readonly canManage = computed(() => {
    const user = this.authService.currentUser();
    const team = this.team();
    if (!user || !team) {
      return false;
    }
    return user.role === 'ADMIN' || user.username === team.username;
  });

  readonly canEditRoster = computed(() => this.canManage() && (!this.transfersLocked() || this.isAdmin()));

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  cellAt(row: number, col: number): SlotRef | null {
    return this.slots().find((s) => s.row === row && s.col === col) ?? null;
  }

  goBack(): void {
    this.router.navigateByUrl('/my-teams');
  }

  viewStandings(): void {
    const team = this.team();
    if (team) {
      this.router.navigate(['/leagues', team.leagueId, 'standings']);
    }
  }

  editRoster(): void {
    const team = this.team();
    const league = this.league();
    if (!team || !league) {
      return;
    }

    const data: JoinLeagueDialogData = {
      fantasyGameId: league.fantasyGameId,
      leagues: [league],
      preselectedLeagueId: league.id,
      existingTeam: { id: team.id, name: team.name, playerIds: team.playerIds }
    };
    const ref = this.dialog.open(JoinLeagueDialogComponent, { data, width: '480px' });

    ref.afterClosed().subscribe((result: FantasyTeamRequest | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyTeamService.update(team.id, result).subscribe({
        next: () => {
          this.snackBar.open('Team updated.', 'Close', { duration: 3000 });
          this.load();
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Failed to update team.';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        }
      });
    });
  }

  deleteTeam(): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.confirmDialog.confirm({ title: 'Delete Team', message: `Delete team "${team.name}"?` }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.fantasyTeamService.delete(team.id).subscribe({
        next: () => {
          this.snackBar.open('Team deleted.', 'Close', { duration: 3000 });
          this.router.navigateByUrl('/my-teams');
        },
        error: () => this.snackBar.open('Failed to delete team. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  private load(): void {
    this.fantasyTeamService.getById(this.teamId).subscribe((team) => {
      this.team.set(team);

      this.leagueService.getById(team.leagueId).subscribe((league) => {
        this.league.set(league);

        forkJoin({
          fantasyGame: this.fantasyGameService.getById(league.fantasyGameId),
          players: this.playerService.getAll(league.fantasyGameId),
          rounds: this.roundService.getAll(league.fantasyGameId)
        }).subscribe(({ fantasyGame, players, rounds }) => {
          this.fantasyGame.set(fantasyGame);
          this.rosterPlayers.set(players.filter((p) => team.playerIds.includes(p.id)));
          this.transfersLocked.set(rounds.some((r) => r.status === 'ACTIVE'));
        });
      });
    });
  }
}
