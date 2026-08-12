import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { PlayerService } from '../../../core/services/player.service';
import { RoundService } from '../../../core/services/round.service';
import { FantasyGamePositionResponse } from '../../../core/models/fantasy-game-position.model';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyTeamRequest, FantasyTeamResponse } from '../../../core/models/fantasy-team.model';
import { PlayerResponse } from '../../../core/models/player.model';
import { environment } from '../../../../environments/environment';

interface SlotRef {
  row: number;
  col: number;
  positionName: string;
  player: PlayerResponse | null;
}

const BENCH_SECTION_ROW_LIMIT = 0;

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [MatButtonModule, MatCardModule, MatIconModule, MatTabsModule, MatToolbarModule, MatTooltipModule],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss'
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly playerService = inject(PlayerService);
  private readonly roundService = inject(RoundService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  private teamId!: number;

  readonly team = signal<FantasyTeamResponse | null>(null);
  readonly fantasyGame = signal<FantasyGameResponse | null>(null);
  readonly allPlayers = signal<PlayerResponse[]>([]);
  readonly selectedPlayerIds = signal<Set<number>>(new Set());
  readonly transfersLocked = signal(false);
  readonly positionFilter = signal<string | null>(null);
  readonly saving = signal(false);

  readonly cellSize = 70;

  readonly backgroundDisplayUrl = computed(() => {
    const url = this.fantasyGame()?.backgroundImageUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly rosterPlayers = computed<PlayerResponse[]>(() => {
    const ids = this.selectedPlayerIds();
    return this.allPlayers().filter((p) => ids.has(p.id));
  });

  readonly totalCost = computed(() => this.rosterPlayers().reduce((sum, p) => sum + (p.price ?? 0), 0));

  readonly overBudget = computed(() => {
    const budget = this.fantasyGame()?.budget;
    return budget != null && this.totalCost() > budget;
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

  readonly hasPickField = computed(() => {
    const fantasyGame = this.fantasyGame();
    return fantasyGame?.pickFieldRows != null && fantasyGame?.pickFieldCols != null;
  });

  readonly hasUnsavedChanges = computed(() => {
    const team = this.team();
    if (!team) {
      return false;
    }
    const original = new Set(team.playerIds);
    const current = this.selectedPlayerIds();
    if (original.size !== current.size) {
      return true;
    }
    for (const id of current) {
      if (!original.has(id)) {
        return true;
      }
    }
    return false;
  });

  readonly canSave = computed(
    () => this.canEditRoster() && this.hasUnsavedChanges() && !this.overBudget() && !this.saving()
  );

  // --- Pick Team tab (read-only, based on the pick field layout) ---

  readonly pickGridRows = computed(() => Array.from({ length: this.fantasyGame()?.pickFieldRows ?? 0 }, (_, i) => i));
  readonly pickGridCols = computed(() => Array.from({ length: this.fantasyGame()?.pickFieldCols ?? 0 }, (_, i) => i));

  private readonly pickAllSlots = computed<SlotRef[]>(() =>
    this.buildSlots(this.fantasyGame()?.pickPositions ?? [], this.rosterPlayers())
  );

  readonly pickFieldSlots = computed(() =>
    this.pickAllSlots().filter(
      (s) => s.row >= 0 && s.row < this.pickGridRows().length && s.col >= 0 && s.col < this.pickGridCols().length
    )
  );

  readonly pickBenchSlots = computed(() => this.pickAllSlots().filter((s) => s.row < BENCH_SECTION_ROW_LIMIT));

  // --- Make Transfers tab (editable, based on the main field layout) ---

  readonly gridRows = computed(() => Array.from({ length: this.fantasyGame()?.fieldRows ?? 0 }, (_, i) => i));
  readonly gridCols = computed(() => Array.from({ length: this.fantasyGame()?.fieldCols ?? 0 }, (_, i) => i));

  private readonly allSlots = computed<SlotRef[]>(() =>
    this.buildSlots(this.fantasyGame()?.positions ?? [], this.rosterPlayers())
  );

  readonly fieldSlots = computed(() =>
    this.allSlots().filter(
      (s) => s.row >= 0 && s.row < this.gridRows().length && s.col >= 0 && s.col < this.gridCols().length
    )
  );

  readonly benchSlots = computed(() => this.allSlots().filter((s) => s.row < BENCH_SECTION_ROW_LIMIT));

  readonly slotsByPosition = computed(() => {
    const map = new Map<string, number>();
    for (const position of this.fantasyGame()?.positions ?? []) {
      map.set(position.name, position.slots.length);
    }
    return map;
  });

  readonly positionNames = computed(() => (this.fantasyGame()?.positions ?? []).map((p) => p.name));

  readonly sortedPlayers = computed(() => [...this.allPlayers()].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)));

  readonly filteredPlayers = computed(() => {
    const filter = this.positionFilter();
    return filter ? this.sortedPlayers().filter((p) => p.position === filter) : this.sortedPlayers();
  });

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private buildSlots(positions: FantasyGamePositionResponse[], players: PlayerResponse[]): SlotRef[] {
    if (positions.length === 0) {
      return [];
    }
    const remainingByPosition = new Map<string, PlayerResponse[]>();
    for (const player of players) {
      const list = remainingByPosition.get(player.position) ?? [];
      list.push(player);
      remainingByPosition.set(player.position, list);
    }
    for (const list of remainingByPosition.values()) {
      list.sort((a, b) => a.id - b.id);
    }

    const result: SlotRef[] = [];
    for (const position of positions) {
      const remaining = remainingByPosition.get(position.name) ?? [];
      for (const slot of position.slots) {
        result.push({ row: slot.rowIndex, col: slot.colIndex, positionName: position.name, player: remaining.shift() ?? null });
      }
    }
    return result;
  }

  cellAt(row: number, col: number): SlotRef | null {
    return this.fieldSlots().find((s) => s.row === row && s.col === col) ?? null;
  }

  pickCellAt(row: number, col: number): SlotRef | null {
    return this.pickFieldSlots().find((s) => s.row === row && s.col === col) ?? null;
  }

  isSelected(player: PlayerResponse): boolean {
    return this.selectedPlayerIds().has(player.id);
  }

  hasFreeSlot(positionName: string): boolean {
    const total = this.slotsByPosition().get(positionName) ?? 0;
    const filled = this.rosterPlayers().filter((p) => p.position === positionName).length;
    return filled < total;
  }

  wouldExceedBudget(player: PlayerResponse): boolean {
    const budget = this.fantasyGame()?.budget;
    if (budget == null) {
      return false;
    }
    return this.totalCost() + (player.price ?? 0) > budget;
  }

  canAddPlayer(player: PlayerResponse): boolean {
    return (
      this.canEditRoster() &&
      !this.isSelected(player) &&
      this.hasFreeSlot(player.position) &&
      !this.wouldExceedBudget(player)
    );
  }

  addPlayerReason(player: PlayerResponse): string {
    if (!this.canEditRoster()) {
      return 'Locked while a round is active';
    }
    if (this.isSelected(player)) {
      return 'Already in your team';
    }
    if (!this.hasFreeSlot(player.position)) {
      return `No free ${player.position} slot`;
    }
    if (this.wouldExceedBudget(player)) {
      return 'Would exceed the budget';
    }
    return 'Add to team';
  }

  addPlayer(player: PlayerResponse): void {
    if (!this.canAddPlayer(player)) {
      return;
    }
    this.selectedPlayerIds.update((ids) => new Set(ids).add(player.id));
  }

  removePlayer(player: PlayerResponse): void {
    if (!this.canEditRoster()) {
      return;
    }
    this.selectedPlayerIds.update((ids) => {
      const next = new Set(ids);
      next.delete(player.id);
      return next;
    });
  }

  playerShortLabel(player: PlayerResponse): string {
    return `${player.lastName} ${player.firstName.charAt(0)}.`;
  }

  filterByPosition(positionName: string): void {
    this.positionFilter.set(this.positionFilter() === positionName ? null : positionName);
  }

  clearFilter(): void {
    this.positionFilter.set(null);
  }

  playerPhotoUrl(player: PlayerResponse): string | null {
    return player.imageUrl ? `${environment.apiUrl}${player.imageUrl}` : null;
  }

  discardChanges(): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.selectedPlayerIds.set(new Set(team.playerIds));
  }

  saveTransfers(): void {
    const team = this.team();
    if (!team || !this.canSave()) {
      return;
    }

    const request: FantasyTeamRequest = {
      name: team.name,
      fantasyGameId: team.fantasyGameId,
      playerIds: [...this.selectedPlayerIds()]
    };

    this.saving.set(true);
    this.fantasyTeamService.update(team.id, request).subscribe({
      next: (updated) => {
        this.team.set(updated);
        this.selectedPlayerIds.set(new Set(updated.playerIds));
        this.saving.set(false);
        this.snackBar.open('Transfers saved.', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message ?? 'Failed to save transfers.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  goBack(): void {
    this.router.navigateByUrl('/my-teams');
  }

  viewStandings(leagueId: number): void {
    this.router.navigate(['/leagues', leagueId, 'standings']);
  }

  leaveLeague(leagueId: number): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.fantasyTeamService.leaveLeague(team.id, leagueId).subscribe({
      next: (updated) => {
        this.team.set(updated);
        this.snackBar.open('Left league.', 'Close', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to leave league.', 'Close', { duration: 4000 })
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
      this.selectedPlayerIds.set(new Set(team.playerIds));

      forkJoin({
        fantasyGame: this.fantasyGameService.getById(team.fantasyGameId),
        players: this.playerService.getAll(team.fantasyGameId),
        rounds: this.roundService.getAll(team.fantasyGameId)
      }).subscribe(({ fantasyGame, players, rounds }) => {
        this.fantasyGame.set(fantasyGame);
        this.allPlayers.set(players);
        this.transfersLocked.set(rounds.some((r) => r.status === 'ACTIVE'));
      });
    });
  }
}
