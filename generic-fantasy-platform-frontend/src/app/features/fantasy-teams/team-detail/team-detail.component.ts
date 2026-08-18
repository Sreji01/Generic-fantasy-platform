import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { LeagueService } from '../../../core/services/league.service';
import { PlayerResultService } from '../../../core/services/player-result.service';
import { PlayerService } from '../../../core/services/player.service';
import { RoundService } from '../../../core/services/round.service';
import { FantasyGamePositionResponse } from '../../../core/models/fantasy-game-position.model';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyTeamRequest, FantasyTeamResponse } from '../../../core/models/fantasy-team.model';
import { LeagueResponse } from '../../../core/models/league.model';
import { PlayerResponse } from '../../../core/models/player.model';
import { RoundResponse } from '../../../core/models/round.model';
import { JoinLeagueDialogComponent } from '../../leagues/join-league-dialog/join-league-dialog.component';
import { PlayerCardDialogComponent } from '../player-card-dialog/player-card-dialog.component';
import { environment } from '../../../../environments/environment';

interface SubSelection {
  player: PlayerResponse;
  isOnField: boolean;
}

interface SlotRef {
  row: number;
  col: number;
  positionName: string;
  player: PlayerResponse | null;
}

const BENCH_SECTION_ROW_LIMIT = 0;
const BENCH_ROW_OFFSET = -2;

@Component({
  selector: 'app-team-detail',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
  ],
  templateUrl: './team-detail.component.html',
  styleUrl: './team-detail.component.scss',
})
export class TeamDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly authService = inject(AuthService);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly leagueService = inject(LeagueService);
  private readonly playerService = inject(PlayerService);
  private readonly roundService = inject(RoundService);
  private readonly playerResultService = inject(PlayerResultService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private teamId!: number;

  readonly team = signal<FantasyTeamResponse | null>(null);
  readonly fantasyGame = signal<FantasyGameResponse | null>(null);
  readonly rounds = signal<RoundResponse[]>([]);
  readonly roundPoints = signal<Map<number, number>>(new Map());
  readonly leagues = signal<LeagueResponse[]>([]);
  readonly allPlayers = signal<PlayerResponse[]>([]);
  readonly selectedPlayerIds = signal<Set<number>>(new Set());
  readonly transfersLocked = signal(false);
  readonly positionFilter = signal<string | null>(null);
  readonly selectedSlotKey = signal<string | null>(null);
  readonly clubFilter = signal<string | null>(null);
  readonly minPriceFilter = signal<number | null>(null);
  readonly maxPriceFilter = signal<number | null>(null);
  readonly priceSortDirection = signal<'asc' | 'desc'>('desc');
  readonly listExpanded = signal(false);
  readonly saving = signal(false);
  readonly lineupRank = signal<Map<number, number>>(new Map());
  readonly subSelection = signal<SubSelection | null>(null);
  readonly subModeActive = signal(false);

  readonly cellSize = 76;

  readonly backgroundDisplayUrl = computed(() => {
    const url = this.fantasyGame()?.backgroundImageUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly benchBackgroundDisplayUrl = computed(() => {
    const url = this.fantasyGame()?.benchBackgroundImageUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly rosterPlayers = computed<PlayerResponse[]>(() => {
    const ids = this.selectedPlayerIds();
    return this.allPlayers().filter((p) => ids.has(p.id));
  });

  readonly totalCost = computed(() =>
    this.rosterPlayers().reduce((sum, p) => sum + (p.price ?? 0), 0),
  );

  readonly overBudget = computed(() => {
    const budget = this.fantasyGame()?.budget;
    return budget != null && this.totalCost() > budget;
  });

  readonly currencyLabel = computed(() => {
    const currency = this.fantasyGame()?.currency;
    return currency ? ` ${currency}` : '';
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

  /** Roster changes always apply starting with the next round, so editing stays open even while a round is active. */
  readonly canEditRoster = computed(() => this.canManage());

  readonly joinedLeagueIds = computed(() => new Set((this.team()?.leagues ?? []).map((l) => l.id)));

  readonly myLeagues = computed(() =>
    this.leagues()
      .filter((l) => this.joinedLeagueIds().has(l.id))
      .sort((a, b) => b.participantCount - a.participantCount),
  );

  readonly popularLeagues = computed(() =>
    this.leagues()
      .filter((l) => !this.joinedLeagueIds().has(l.id))
      .sort((a, b) => b.participantCount - a.participantCount),
  );

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
    () => this.canEditRoster() && this.hasUnsavedChanges() && !this.overBudget() && !this.saving(),
  );

  // --- Points tab (read-only, current round score based on the pick field layout) ---

  readonly currentRound = computed<RoundResponse | null>(() => {
    const rounds = this.rounds();
    const now = new Date();

    const active = rounds.find((r) => this.isRoundInScoringWindow(r, now));
    if (active) {
      return active;
    }

    const ended = rounds
      .filter((r) => r.endDate != null && this.endOfDay(r.endDate) < now)
      .sort((a, b) => this.endOfDay(b.endDate!).getTime() - this.endOfDay(a.endDate!).getTime());
    return ended[0] ?? null;
  });

  /** A round scores from its transfer deadline through 23:59:59 on its end date, regardless of its stored status. */
  private isRoundInScoringWindow(round: RoundResponse, now: Date): boolean {
    if (!round.transferDeadline || !round.endDate) {
      return false;
    }
    const start = new Date(round.transferDeadline);
    const end = this.endOfDay(round.endDate);
    return now >= start && now <= end;
  }

  private endOfDay(dateOnly: string): Date {
    return new Date(`${dateOnly}T23:59:59`);
  }

  /** Matches the backend's ScoreService, which sums every roster player (starting XI and bench) for the round. */
  readonly currentRoundTotalPoints = computed(() => {
    const points = this.roundPoints();
    return this.rosterPlayers().reduce((sum, player) => sum + (points.get(player.id) ?? 0), 0);
  });

  pointsFor(player: PlayerResponse | null): number {
    if (!player) {
      return 0;
    }
    return this.roundPoints().get(player.id) ?? 0;
  }

  // --- Pick Team tab (read-only, based on the pick field layout) ---

  readonly pickGridRows = computed(() =>
    Array.from({ length: this.fantasyGame()?.pickFieldRows ?? 0 }, (_, i) => i),
  );
  readonly pickGridCols = computed(() =>
    Array.from({ length: this.fantasyGame()?.pickFieldCols ?? 0 }, (_, i) => i),
  );

  private readonly pickAllSlots = computed<SlotRef[]>(() =>
    this.buildSlots(this.fantasyGame()?.pickPositions ?? [], this.rosterPlayers()),
  );

  readonly pickFieldSlots = computed(() =>
    this.pickAllSlots().filter(
      (s) =>
        s.row >= 0 &&
        s.row < this.pickGridRows().length &&
        s.col >= 0 &&
        s.col < this.pickGridCols().length,
    ),
  );

  readonly pickBenchSlots = computed(() =>
    this.pickAllSlots().filter((s) => s.row < BENCH_SECTION_ROW_LIMIT),
  );

  readonly hasPickBench = computed(() => {
    const fantasyGame = this.fantasyGame();
    return fantasyGame?.pickBenchRows != null && fantasyGame?.pickBenchCols != null;
  });

  readonly pickBenchGridRows = computed(() =>
    Array.from({ length: this.fantasyGame()?.pickBenchRows ?? 0 }, (_, i) => i),
  );
  readonly pickBenchGridCols = computed(() =>
    Array.from({ length: this.fantasyGame()?.pickBenchCols ?? 0 }, (_, i) => i),
  );

  // --- Make Transfers tab (editable, based on the main field layout) ---

  readonly gridRows = computed(() =>
    Array.from({ length: this.fantasyGame()?.fieldRows ?? 0 }, (_, i) => i),
  );
  readonly gridCols = computed(() =>
    Array.from({ length: this.fantasyGame()?.fieldCols ?? 0 }, (_, i) => i),
  );

  private static readonly FILTER_ROWS_HEIGHT_PX = 168;

  readonly playersListHeightPx = computed(() => {
    const rows = this.gridRows().length;
    if (rows === 0) {
      return 0;
    }
    const gaps = (rows - 1) * 2;
    const paddingAndBorder = 4 * 2 + 2 * 2;
    const fieldHeight = rows * this.cellSize + gaps + paddingAndBorder;
    const base = Math.max(0, fieldHeight - TeamDetailComponent.FILTER_ROWS_HEIGHT_PX);
    return this.listExpanded() ? base * 2 : base;
  });

  private readonly allSlots = computed<SlotRef[]>(() =>
    this.buildSlots(this.fantasyGame()?.positions ?? [], this.rosterPlayers()),
  );

  readonly fieldSlots = computed(() =>
    this.allSlots().filter(
      (s) =>
        s.row >= 0 &&
        s.row < this.gridRows().length &&
        s.col >= 0 &&
        s.col < this.gridCols().length,
    ),
  );

  readonly benchSlots = computed(() =>
    this.allSlots().filter((s) => s.row < BENCH_SECTION_ROW_LIMIT),
  );

  readonly hasBench = computed(() => {
    const fantasyGame = this.fantasyGame();
    return fantasyGame?.benchRows != null && fantasyGame?.benchCols != null;
  });

  readonly benchGridRows = computed(() =>
    Array.from({ length: this.fantasyGame()?.benchRows ?? 0 }, (_, i) => i),
  );
  readonly benchGridCols = computed(() =>
    Array.from({ length: this.fantasyGame()?.benchCols ?? 0 }, (_, i) => i),
  );

  readonly slotsByPosition = computed(() => {
    const map = new Map<string, number>();
    for (const position of this.fantasyGame()?.positions ?? []) {
      map.set(position.name, position.slots.length);
    }
    return map;
  });

  readonly positionNames = computed(() => (this.fantasyGame()?.positions ?? []).map((p) => p.name));

  readonly clubNames = computed(() =>
    [
      ...new Set(
        this.allPlayers()
          .map((p) => p.realTeam)
          .filter((team): team is string => !!team),
      ),
    ].sort(),
  );

  readonly sortedPlayers = computed(() => {
    const direction = this.priceSortDirection() === 'asc' ? 1 : -1;
    return [...this.allPlayers()].sort((a, b) => direction * ((a.price ?? 0) - (b.price ?? 0)));
  });

  readonly filteredPlayers = computed(() => {
    const position = this.positionFilter();
    const club = this.clubFilter();
    const min = this.minPriceFilter();
    const max = this.maxPriceFilter();

    return this.sortedPlayers().filter((p) => {
      if (position && p.position !== position) {
        return false;
      }
      if (club && p.realTeam !== club) {
        return false;
      }
      if (min != null && (p.price ?? 0) < min) {
        return false;
      }
      if (max != null && (p.price ?? 0) > max) {
        return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.teamId = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  private buildSlots(
    positions: FantasyGamePositionResponse[],
    players: PlayerResponse[],
  ): SlotRef[] {
    if (positions.length === 0) {
      return [];
    }
    const rank = this.lineupRank();
    const rankOf = (player: PlayerResponse) => rank.get(player.id) ?? player.id;

    const remainingByPosition = new Map<string, PlayerResponse[]>();
    for (const player of players) {
      const list = remainingByPosition.get(player.position) ?? [];
      list.push(player);
      remainingByPosition.set(player.position, list);
    }
    for (const list of remainingByPosition.values()) {
      list.sort((a, b) => rankOf(a) - rankOf(b));
    }

    const result: SlotRef[] = [];
    for (const position of positions) {
      const remaining = remainingByPosition.get(position.name) ?? [];
      for (const slot of position.slots) {
        result.push({
          row: slot.rowIndex,
          col: slot.colIndex,
          positionName: position.name,
          player: remaining.shift() ?? null,
        });
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

  benchCellAt(benchRow: number, col: number): SlotRef | null {
    const rowIndex = BENCH_ROW_OFFSET - benchRow;
    return this.benchSlots().find((s) => s.row === rowIndex && s.col === col) ?? null;
  }

  pickBenchCellAt(benchRow: number, col: number): SlotRef | null {
    const rowIndex = BENCH_ROW_OFFSET - benchRow;
    return this.pickBenchSlots().find((s) => s.row === rowIndex && s.col === col) ?? null;
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
      return 'Only the team owner can edit the roster';
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

  slotKey(row: number, col: number, bench: boolean): string {
    return `${bench ? 'bench' : 'field'}-${row}-${col}`;
  }

  selectSlot(cell: SlotRef, key: string): void {
    if (this.selectedSlotKey() === key) {
      this.selectedSlotKey.set(null);
      this.positionFilter.set(null);
    } else {
      this.selectedSlotKey.set(key);
      this.positionFilter.set(cell.positionName);
    }
  }

  setPositionFilter(positionName: string | null): void {
    this.selectedSlotKey.set(null);
    this.positionFilter.set(positionName);
  }

  filterByClub(club: string | null): void {
    this.clubFilter.set(club);
  }

  setMinPriceFilter(value: number | string | null): void {
    this.minPriceFilter.set(this.parsePriceInput(value));
  }

  setMaxPriceFilter(value: number | string | null): void {
    this.maxPriceFilter.set(this.parsePriceInput(value));
  }

  private parsePriceInput(value: number | string | null): number | null {
    if (value == null || value === '') {
      return null;
    }
    const parsed = typeof value === 'number' ? value : Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  togglePriceSort(): void {
    this.priceSortDirection.set(this.priceSortDirection() === 'desc' ? 'asc' : 'desc');
  }

  toggleListExpanded(): void {
    this.listExpanded.update((expanded) => !expanded);
  }

  playerPhotoUrl(player: PlayerResponse): string | null {
    return player.imageUrl ? `${environment.apiUrl}${player.imageUrl}` : null;
  }

  onPickCardClick(player: PlayerResponse | null, isOnField: boolean): void {
    if (!player || !this.canEditRoster()) {
      return;
    }

    if (this.subModeActive()) {
      const selection = this.subSelection();
      if (
        selection &&
        player.id !== selection.player.id &&
        player.position === selection.player.position
      ) {
        this.swapLineup(selection.player, player);
      }
      this.cancelSub();
      return;
    }

    const ref = this.dialog.open(PlayerCardDialogComponent, {
      data: { player, isOnField, currency: this.fantasyGame()?.currency },
      width: '360px',
    });

    ref.afterClosed().subscribe((startSub: boolean | undefined) => {
      if (startSub) {
        this.subSelection.set({ player, isOnField });
        this.subModeActive.set(true);
      }
    });
  }

  onPointsCardClick(player: PlayerResponse | null, isOnField: boolean): void {
    if (!player) {
      return;
    }
    this.dialog.open(PlayerCardDialogComponent, {
      data: { player, isOnField, currency: this.fantasyGame()?.currency, showSubAction: false },
      width: '360px',
    });
  }

  cancelSub(): void {
    this.subSelection.set(null);
    this.subModeActive.set(false);
  }

  isSubSelected(player: PlayerResponse | null): boolean {
    const selection = this.subSelection();
    return !!player && !!selection && selection.player.id === player.id;
  }

  isSubDimmed(player: PlayerResponse | null): boolean {
    if (!this.subModeActive()) {
      return false;
    }
    const selection = this.subSelection();
    if (!selection) {
      return false;
    }
    return (
      !player || player.id === selection.player.id || player.position !== selection.player.position
    );
  }

  private swapLineup(a: PlayerResponse, b: PlayerResponse): void {
    this.lineupRank.update((rank) => {
      const next = new Map(rank);
      const rankA = next.get(a.id) ?? a.id;
      const rankB = next.get(b.id) ?? b.id;
      next.set(a.id, rankB);
      next.set(b.id, rankA);
      return next;
    });
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
      playerIds: [...this.selectedPlayerIds()],
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
      },
    });
  }

  goBack(): void {
    this.location.back();
  }

  canViewStandings(league: LeagueResponse): boolean {
    return league.isPublic || this.joinedLeagueIds().has(league.id) || this.canManage();
  }

  viewStandings(leagueId: number): void {
    this.router.navigate(['/leagues', leagueId, 'standings']);
  }

  joinLeague(league: LeagueResponse): void {
    if (!league.isPublic) {
      const ref = this.dialog.open(JoinLeagueDialogComponent, {
        data: { leagueName: league.name },
        width: '420px',
      });
      ref.afterClosed().subscribe((code: string | undefined) => {
        if (!code) {
          return;
        }
        this.joinWithCurrentTeam(league, code);
      });
      return;
    }
    this.joinWithCurrentTeam(league, undefined);
  }

  private joinWithCurrentTeam(league: LeagueResponse, code: string | undefined): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.fantasyTeamService.joinLeague(team.id, league.id, code).subscribe({
      next: (updated) => {
        this.team.set(updated);
        this.snackBar.open('Joined league.', 'Close', { duration: 3000 });
        this.reloadLeagues();
      },
      error: (err) => {
        const message = err?.error?.message ?? 'Failed to join league.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      },
    });
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
        this.reloadLeagues();
      },
      error: () => this.snackBar.open('Failed to leave league.', 'Close', { duration: 4000 }),
    });
  }

  private reloadLeagues(): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.leagueService.getAll(team.fantasyGameId).subscribe((leagues) => this.leagues.set(leagues));
  }

  deleteTeam(): void {
    const team = this.team();
    if (!team) {
      return;
    }
    this.confirmDialog
      .confirm({ title: 'Delete Team', message: `Delete team "${team.name}"?` })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.fantasyTeamService.delete(team.id).subscribe({
          next: () => {
            this.snackBar.open('Team deleted.', 'Close', { duration: 3000 });
            this.router.navigateByUrl('/my-teams');
          },
          error: () =>
            this.snackBar.open('Failed to delete team. You may not have permission.', 'Close', {
              duration: 4000,
            }),
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
        rounds: this.roundService.getAll(team.fantasyGameId),
        leagues: this.leagueService.getAll(team.fantasyGameId),
      }).subscribe(({ fantasyGame, players, rounds, leagues }) => {
        this.fantasyGame.set(fantasyGame);
        this.allPlayers.set(players);
        this.rounds.set(rounds);
        const now = new Date().toISOString();
        this.transfersLocked.set(
          rounds.some(
            (r) =>
              r.status === 'ACTIVE' ||
              (r.status !== 'FINISHED' && r.transferDeadline != null && r.transferDeadline <= now),
          ),
        );
        this.leagues.set(leagues);
        this.loadRoundPoints();
      });
    });
  }

  private loadRoundPoints(): void {
    const round = this.currentRound();
    if (!round) {
      this.roundPoints.set(new Map());
      return;
    }
    this.playerResultService.getByRound(round.id).subscribe((results) => {
      this.roundPoints.set(new Map(results.map((r) => [r.playerId, r.pointsEarned ?? 0])));
    });
  }
}
