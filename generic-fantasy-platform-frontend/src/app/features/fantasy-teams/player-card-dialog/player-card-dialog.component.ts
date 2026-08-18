import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { PlayerResponse } from '../../../core/models/player.model';
import { environment } from '../../../../environments/environment';

export interface PlayerCardDialogData {
  player: PlayerResponse;
  isOnField: boolean;
  currency?: string | null;
  showSubAction?: boolean;
}

@Component({
  selector: 'app-player-card-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule],
  templateUrl: './player-card-dialog.component.html',
  styleUrl: './player-card-dialog.component.scss',
})
export class PlayerCardDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<PlayerCardDialogComponent, boolean>,
    @Inject(MAT_DIALOG_DATA) readonly data: PlayerCardDialogData,
  ) {}

  photoUrl(player: PlayerResponse): string | null {
    return player.imageUrl ? `${environment.apiUrl}${player.imageUrl}` : null;
  }

  startSub(): void {
    this.dialogRef.close(true);
  }

  close(): void {
    this.dialogRef.close(false);
  }
}
