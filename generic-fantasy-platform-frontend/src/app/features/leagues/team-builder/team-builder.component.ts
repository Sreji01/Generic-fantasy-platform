import { Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { PlayerService } from '../../../core/services/player.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyTeamRequest } from '../../../core/models/fantasy-team.model';
import { PlayerResponse } from '../../../core/models/player.model';
import { environment } from '../../../../environments/environment';

interface SlotCell {
  row: number;
  col: number;
  positionName: string;
  player: PlayerResponse | null;
}

const BENCH_SECTION_ROW_LIMIT = 0;

@Component({
  selector: 'app-team-builder',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  templateUrl: './team-builder.component.html',
  styleUrl: './team-builder.component.scss'
})
export class TeamBuilderComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly playerService = inject(PlayerService);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly snackBar = inject(MatSnackBar);

  private fantasyGameId!: number;
  private teamId: number | null = null;
  private joinLeagueId: number | null = null;

  readonly isEditMode = computed(() => this.teamId != null);
  readonly teamName = signal('');
  readonly fantasyGame = signal<FantasyGameResponse | null>(null);
  readonly players = signal<PlayerResponse[]>([]);
  readonly selectedPlayerIds = signal<Set<number>>(new Set());
  readonly positionFilter = signal<string | null>(null);
  readonly saving = signal(false);

  readonly cellSize = 90;

  readonly usePickField = computed(() => {
    const fantasyGame = this.fantasyGame();
    return this.isEditMode() && fantasyGame?.pickFieldRows != null && fantasyGame?.pickFieldCols != null;
  });

  private readonly activeFieldRows = computed(
    () => (this.usePickField() ? this.fantasyGame()?.pickFieldRows : this.fantasyGame()?.fieldRows) ?? 0
  );
  private readonly activeFieldCols = computed(
    () => (this.usePickField() ? this.fantasyGame()?.pickFieldCols : this.fantasyGame()?.fieldCols) ?? 0
  );
  private readonly activePositions = computed(
    () => (this.usePickField() ? this.fantasyGame()?.pickPositions : this.fantasyGame()?.positions) ?? []
  );

  readonly gridRows = computed(() => Array.from({ length: this.activeFieldRows() }, (_, i) => i));
  readonly gridCols = computed(() => Array.from({ length: this.activeFieldCols() }, (_, i) => i));

  readonly backgroundDisplayUrl = computed(() => {
    const url = this.fantasyGame()?.backgroundImageUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly selectedPlayers = computed(() => {
    const ids = this.selectedPlayerIds();
    return this.players().filter((p) => ids.has(p.id));
  });

  readonly totalCost = computed(() => this.selectedPlayers().reduce((sum, p) => sum + (p.price ?? 0), 0));

  readonly overBudget = computed(() => {
    const budget = this.fantasyGame()?.budget;
    return budget != null && this.totalCost() > budget;
  });

  readonly canSubmit = computed(() => {
    const hasName = this.teamName().trim().length > 0;
    const hasPlayers = this.selectedPlayerIds().size > 0;
    return hasName && hasPlayers && !this.overBudget() && !this.saving();
  });

  readonly slotsByPosition = computed(() => {
    const map = new Map<string, number>();
    for (const position of this.activePositions()) {
      map.set(position.name, position.slots.length);
    }
    return map;
  });

  readonly positionNames = computed(() => this.activePositions().map((p) => p.name));

  private readonly allSlots = computed<SlotCell[]>(() => {
    const positions = this.activePositions();
    if (positions.length === 0) {
      return [];
    }
    const remainingByPosition = new Map<string, PlayerResponse[]>();
    for (const player of this.selectedPlayers()) {
      const list = remainingByPosition.get(player.position) ?? [];
      list.push(player);
      remainingByPosition.set(player.position, list);
    }
    for (const list of remainingByPosition.values()) {
      list.sort((a, b) => a.id - b.id);
    }

    const result: SlotCell[] = [];
    for (const position of positions) {
      const remaining = remainingByPosition.get(position.name) ?? [];
      for (const slot of position.slots) {
        result.push({ row: slot.rowIndex, col: slot.colIndex, positionName: position.name, player: remaining.shift() ?? null });
      }
    }
    return result;
  });

  readonly fieldSlots = computed(() =>
    this.allSlots().filter(
      (s) => s.row >= 0 && s.row < this.gridRows().length && s.col >= 0 && s.col < this.gridCols().length
    )
  );

  readonly benchSlots = computed(() => this.allSlots().filter((s) => s.row < BENCH_SECTION_ROW_LIMIT));

  readonly sortedPlayers = computed(() => [...this.players()].sort((a, b) => (b.price ?? 0) - (a.price ?? 0)));

  readonly filteredPlayers = computed(() => {
    const filter = this.positionFilter();
    return filter ? this.sortedPlayers().filter((p) => p.position === filter) : this.sortedPlayers();
  });

  ngOnInit(): void {
    this.fantasyGameId = Number(this.route.snapshot.paramMap.get('fantasyGameId'));
    const teamIdParam = this.route.snapshot.queryParamMap.get('teamId');
    this.teamId = teamIdParam ? Number(teamIdParam) : null;
    const joinLeagueIdParam = this.route.snapshot.queryParamMap.get('joinLeagueId');
    this.joinLeagueId = joinLeagueIdParam ? Number(joinLeagueIdParam) : null;

    this.fantasyGameService.getById(this.fantasyGameId).subscribe((fantasyGame) => this.fantasyGame.set(fantasyGame));
    this.playerService.getAll(this.fantasyGameId).subscribe((players) => this.players.set(players));

    if (this.teamId != null) {
      this.fantasyTeamService.getById(this.teamId).subscribe((team) => {
        this.teamName.set(team.name);
        this.selectedPlayerIds.set(new Set(team.playerIds));
      });
    }
  }

  cellAt(row: number, col: number): SlotCell | null {
    return this.fieldSlots().find((s) => s.row === row && s.col === col) ?? null;
  }

  isSelected(player: PlayerResponse): boolean {
    return this.selectedPlayerIds().has(player.id);
  }

  hasFreeSlot(positionName: string): boolean {
    const total = this.slotsByPosition().get(positionName) ?? 0;
    const filled = this.selectedPlayers().filter((p) => p.position === positionName).length;
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
    return !this.isSelected(player) && this.hasFreeSlot(player.position) && !this.wouldExceedBudget(player);
  }

  playerShortLabel(player: PlayerResponse): string {
    return `${player.lastName} ${player.firstName.charAt(0)}.`;
  }

  addPlayerReason(player: PlayerResponse): string {
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
    this.selectedPlayerIds.update((ids) => {
      const next = new Set(ids);
      next.delete(player.id);
      return next;
    });
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

  cancel(): void {
    this.location.back();
  }

  save(): void {
    if (!this.canSubmit()) {
      return;
    }

    const request: FantasyTeamRequest = {
      name: this.teamName().trim(),
      fantasyGameId: this.fantasyGameId,
      playerIds: [...this.selectedPlayerIds()]
    };

    this.saving.set(true);
    const teamId = this.teamId;
    const request$ = teamId != null ? this.fantasyTeamService.update(teamId, request) : this.fantasyTeamService.create(request);

    request$.subscribe({
      next: (team) => {
        this.snackBar.open(teamId != null ? 'Team updated.' : 'Team created!', 'Close', { duration: 3000 });

        if (this.joinLeagueId != null && teamId == null) {
          this.fantasyTeamService.joinLeague(team.id, this.joinLeagueId).subscribe({
            next: () => {
              this.snackBar.open('Joined league.', 'Close', { duration: 3000 });
              this.router.navigate(['/fantasy-teams', team.id]);
            },
            error: (err) => {
              const message = err?.error?.message ?? 'Team created, but failed to join the league.';
              this.snackBar.open(message, 'Close', { duration: 4000 });
              this.router.navigate(['/fantasy-teams', team.id]);
            }
          });
          return;
        }

        this.router.navigate(['/fantasy-teams', team.id]);
      },
      error: (err) => {
        this.saving.set(false);
        const message = err?.error?.message ?? 'Failed to save team.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }
}
