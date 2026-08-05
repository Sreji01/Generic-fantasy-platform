import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { PlayerService } from '../../../core/services/player.service';
import { PlayerResponse } from '../../../core/models/player.model';
import { LeagueResponse } from '../../../core/models/league.model';
import { FantasyTeamRequest } from '../../../core/models/fantasy-team.model';

export interface JoinLeagueDialogData {
  fantasyGameId: number;
  leagues: LeagueResponse[];
  preselectedLeagueId?: number;
  existingTeam?: { id: number; name: string; playerIds: number[] };
}

@Component({
  selector: 'app-join-league-dialog',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './join-league-dialog.component.html',
  styleUrl: './join-league-dialog.component.scss'
})
export class JoinLeagueDialogComponent implements OnInit {
  private readonly dialogRef = inject(MatDialogRef<JoinLeagueDialogComponent>);
  private readonly playerService = inject(PlayerService);
  readonly data = inject<JoinLeagueDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data.existingTeam != null;
  readonly teamName = signal(this.data.existingTeam?.name ?? '');
  readonly players = signal<PlayerResponse[]>([]);
  readonly selectedPlayerIds = signal<Set<number>>(new Set(this.data.existingTeam?.playerIds ?? []));
  readonly selectedLeagueId = signal<number | null>(this.data.preselectedLeagueId ?? null);

  readonly selectedLeague = computed(
    () => this.data.leagues.find((l) => l.id === this.selectedLeagueId()) ?? null
  );

  readonly selectedPlayers = computed(() => {
    const ids = this.selectedPlayerIds();
    return this.players().filter((p) => ids.has(p.id));
  });

  readonly totalCost = computed(() => this.selectedPlayers().reduce((sum, p) => sum + (p.price ?? 0), 0));

  readonly overBudget = computed(() => {
    const league = this.selectedLeague();
    return league?.budget != null && this.totalCost() > league.budget;
  });
  readonly overRoster = computed(() => {
    const league = this.selectedLeague();
    return league?.maxPlayersPerTeam != null && this.selectedPlayerIds().size > league.maxPlayersPerTeam;
  });

  readonly canSubmit = computed(() => {
    const hasLeague = this.selectedLeagueId() != null;
    const hasName = this.teamName().trim().length > 0;
    const hasPlayers = this.selectedPlayerIds().size > 0;
    const withinBudget = !this.overBudget();
    const withinRoster = !this.overRoster();
    return hasLeague && hasName && hasPlayers && withinBudget && withinRoster;
  });

  ngOnInit(): void {
    this.playerService.getAll(this.data.fantasyGameId).subscribe((players) => this.players.set(players));
  }

  isSelected(player: PlayerResponse): boolean {
    return this.selectedPlayerIds().has(player.id);
  }

  togglePlayer(player: PlayerResponse): void {
    this.selectedPlayerIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(player.id)) {
        next.delete(player.id);
      } else {
        next.add(player.id);
      }
      return next;
    });
  }

  save(): void {
    if (!this.canSubmit()) {
      return;
    }

    const result: FantasyTeamRequest = {
      name: this.teamName().trim(),
      leagueId: this.selectedLeagueId()!,
      playerIds: [...this.selectedPlayerIds()]
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
