import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

import { RoundRequest, RoundResponse, RoundStatus } from '../../../core/models/round.model';

export interface RoundFormDialogData extends Partial<RoundResponse> {
  fantasyGameId: number;
}

@Component({
  selector: 'app-round-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDatepickerModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  templateUrl: './round-form-dialog.component.html',
  styleUrl: './round-form-dialog.component.scss',
})
export class RoundFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoundFormDialogComponent>);
  readonly data = inject<RoundFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data.id != null;
  readonly statuses: RoundStatus[] = ['UPCOMING', 'ACTIVE', 'FINISHED'];

  readonly hours = Array.from({ length: 24 }, (_, i) => i);
  readonly minutes = Array.from({ length: 60 }, (_, i) => i);

  readonly form = this.fb.group({
    roundNumber: [this.data.roundNumber ?? 1, [Validators.required]],
    startDate: [this.data.startDate ? new Date(this.data.startDate) : null],
    endDate: [this.data.endDate ? new Date(this.data.endDate) : null],
    transferDeadlineDate: [this.toDeadlineDate(this.data.transferDeadline)],
    transferDeadlineHour: [this.toDeadlineHour(this.data.transferDeadline)],
    transferDeadlineMinute: [this.toDeadlineMinute(this.data.transferDeadline)],
    status: [this.data.status ?? ('UPCOMING' as RoundStatus), [Validators.required]],
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: RoundRequest = {
      roundNumber: raw.roundNumber as number,
      fantasyGameId: this.data.fantasyGameId,
      startDate: this.toIsoDate(raw.startDate),
      endDate: this.toIsoDate(raw.endDate),
      transferDeadline: raw.transferDeadlineDate
        ? `${this.toIsoDate(raw.transferDeadlineDate)}T${this.pad(raw.transferDeadlineHour ?? 0)}:${this.pad(raw.transferDeadlineMinute ?? 0)}:00`
        : undefined,
      status: raw.status as RoundStatus,
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }

  private toIsoDate(value: Date | null | undefined): string | undefined {
    if (!value) {
      return undefined;
    }
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private toDeadlineDate(value: string | null | undefined): Date | null {
    return value ? new Date(value) : null;
  }

  private toDeadlineHour(value: string | null | undefined): number | null {
    return value ? new Date(value).getHours() : null;
  }

  private toDeadlineMinute(value: string | null | undefined): number | null {
    return value ? new Date(value).getMinutes() : null;
  }

  private pad(value: number): string {
    return String(value).padStart(2, '0');
  }
}
