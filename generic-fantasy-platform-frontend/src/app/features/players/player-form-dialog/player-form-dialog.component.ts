import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';

import { PlayerService } from '../../../core/services/player.service';
import { PlayerRequest, PlayerResponse } from '../../../core/models/player.model';
import { environment } from '../../../../environments/environment';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

@Component({
  selector: 'app-player-form-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './player-form-dialog.component.html',
  styleUrl: './player-form-dialog.component.scss'
})
export class PlayerFormDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<PlayerFormDialogComponent>);
  private readonly playerService = inject(PlayerService);
  private readonly snackBar = inject(MatSnackBar);
  readonly data = inject<(Partial<PlayerResponse> & { fantasyGameId: number }) | null>(MAT_DIALOG_DATA);

  readonly isEditMode = this.data?.id != null;
  readonly imageUrl = signal<string | null>(this.data?.imageUrl ?? null);
  readonly imageDisplayUrl = computed(() => {
    const url = this.imageUrl();
    return url ? `${environment.apiUrl}${url}` : null;
  });
  readonly uploading = signal(false);

  readonly form = this.fb.group({
    firstName: [this.data?.firstName ?? '', [Validators.required]],
    lastName: [this.data?.lastName ?? '', [Validators.required]],
    position: [this.data?.position ?? '', [Validators.required]],
    realTeam: [this.data?.realTeam ?? ''],
    price: [this.data?.price ?? null]
  });

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.snackBar.open('Please select an image file.', 'Close', { duration: 3500 });
      input.value = '';
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      this.snackBar.open('Image is too large. Maximum size is 10MB.', 'Close', { duration: 3500 });
      input.value = '';
      return;
    }

    this.uploading.set(true);
    this.playerService.uploadImage(this.data!.id!, file).subscribe({
      next: (player) => {
        this.imageUrl.set(player.imageUrl);
        this.uploading.set(false);
        input.value = '';
      },
      error: () => {
        this.snackBar.open('Failed to upload photo.', 'Close', { duration: 3000 });
        this.uploading.set(false);
        input.value = '';
      }
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const result: PlayerRequest = {
      firstName: raw.firstName ?? '',
      lastName: raw.lastName ?? '',
      position: raw.position ?? '',
      realTeam: raw.realTeam || undefined,
      price: raw.price ?? undefined,
      imageUrl: this.imageUrl() ?? undefined,
      fantasyGameId: this.data!.fantasyGameId
    };

    this.dialogRef.close(result);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
