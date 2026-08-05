import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
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
  imports: [ReactiveFormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatSelectModule],
  templateUrl: './round-form-dialog.component.html',
  styleUrl: './round-form-dialog.component.scss'
})
export class RoundFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<RoundFormDialogComponent>);
  readonly data = inject<RoundFormDialogData>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data.id != null;
  readonly statuses: RoundStatus[] = ['UPCOMING', 'ACTIVE', 'FINISHED'];

  readonly form = this.fb.group({
    name: [this.data.name ?? '', [Validators.required]],
    roundNumber: [this.data.roundNumber ?? 1, [Validators.required]],
    startDate: [this.data.startDate ?? ''],
    endDate: [this.data.endDate ?? ''],
    status: [this.data.status ?? ('UPCOMING' as RoundStatus), [Validators.required]]
  });

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: RoundRequest = {
      name: raw.name ?? '',
      roundNumber: raw.roundNumber as number,
      fantasyGameId: this.data.fantasyGameId,
      startDate: raw.startDate || undefined,
      endDate: raw.endDate || undefined,
      status: raw.status as RoundStatus
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
