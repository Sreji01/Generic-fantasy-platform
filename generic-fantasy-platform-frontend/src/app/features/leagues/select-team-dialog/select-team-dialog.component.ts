import { Component, Inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import { FantasyTeamResponse } from '../../../core/models/fantasy-team.model';

export interface SelectTeamDialogData {
  teams: FantasyTeamResponse[];
  leagueName: string;
}

export type SelectTeamDialogResult = FantasyTeamResponse | 'new';

@Component({
  selector: 'app-select-team-dialog',
  standalone: true,
  imports: [MatButtonModule, MatDialogModule, MatIconModule, MatListModule],
  templateUrl: './select-team-dialog.component.html',
  styleUrl: './select-team-dialog.component.scss'
})
export class SelectTeamDialogComponent {
  constructor(
    private readonly dialogRef: MatDialogRef<SelectTeamDialogComponent, SelectTeamDialogResult>,
    @Inject(MAT_DIALOG_DATA) readonly data: SelectTeamDialogData
  ) {}

  choose(team: FantasyTeamResponse): void {
    this.dialogRef.close(team);
  }

  createNew(): void {
    this.dialogRef.close('new');
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
