import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { LeagueRequest, LeagueResponse, LeagueStatus } from '../../../core/models/league.model';

@Component({
  selector: 'app-league-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './league-form-dialog.component.html',
  styleUrl: './league-form-dialog.component.scss'
})
export class LeagueFormDialogComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<LeagueFormDialogComponent>);
  private readonly fantasyGameService = inject(FantasyGameService);
  readonly data = inject<Partial<LeagueResponse> | null>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data?.id != null;
  readonly fantasyGames = signal<FantasyGameResponse[]>([]);
  readonly statuses: LeagueStatus[] = ['UPCOMING', 'ACTIVE', 'FINISHED'];

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? ''],
    fantasyGameId: [this.data?.fantasyGameId ?? null, [Validators.required]],
    startDate: [this.data?.startDate ?? ''],
    endDate: [this.data?.endDate ?? ''],
    status: [this.data?.status ?? ('UPCOMING' as LeagueStatus), [Validators.required]],
    maxPlayersPerTeam: [this.data?.maxPlayersPerTeam ?? null],
    budget: [this.data?.budget ?? null],
    isPublic: [this.data?.isPublic ?? true]
  });

  ngOnInit(): void {
    this.fantasyGameService.getAll().subscribe((fantasyGames) => this.fantasyGames.set(fantasyGames));
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: LeagueRequest = {
      name: raw.name ?? '',
      description: raw.description || undefined,
      fantasyGameId: raw.fantasyGameId as number,
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,
      status: raw.status as LeagueStatus,
      maxPlayersPerTeam: raw.maxPlayersPerTeam ?? undefined,
      budget: raw.budget ?? undefined,
      isPublic: raw.isPublic ?? true
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
