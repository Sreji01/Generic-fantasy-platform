import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { DomainService } from '../../../core/services/domain.service';
import { DomainResponse } from '../../../core/models/domain.model';
import { LeagueRequest, LeagueResponse, LeagueStatus } from '../../../core/models/league.model';

@Component({
  selector: 'app-league-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
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
  private readonly domainService = inject(DomainService);
  readonly data = inject<Partial<LeagueResponse> | null>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data?.id != null;
  readonly domains = signal<DomainResponse[]>([]);
  readonly statuses: LeagueStatus[] = ['UPCOMING', 'ACTIVE', 'FINISHED'];

  readonly form = this.fb.group({
    name: [this.data?.name ?? '', [Validators.required]],
    description: [this.data?.description ?? ''],
    domainId: [this.data?.domainId ?? null, [Validators.required]],
    startDate: [this.data?.startDate ?? ''],
    endDate: [this.data?.endDate ?? ''],
    status: [this.data?.status ?? ('UPCOMING' as LeagueStatus), [Validators.required]],
    maxPlayersPerTeam: [this.data?.maxPlayersPerTeam ?? null],
    budget: [this.data?.budget ?? null]
  });

  ngOnInit(): void {
    this.domainService.getAll().subscribe((domains) => this.domains.set(domains));
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
      domainId: raw.domainId as number,
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,
      status: raw.status as LeagueStatus,
      maxPlayersPerTeam: raw.maxPlayersPerTeam ?? undefined,
      budget: raw.budget ?? undefined
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
