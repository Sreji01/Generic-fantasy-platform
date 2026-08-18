import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface JoinLeagueDialogData {
  leagueName: string;
}

@Component({
  selector: 'app-join-league-dialog',
  standalone: true,
  imports: [FormsModule, MatButtonModule, MatDialogModule, MatFormFieldModule, MatInputModule],
  templateUrl: './join-league-dialog.component.html',
  styleUrl: './join-league-dialog.component.scss'
})
export class JoinLeagueDialogComponent {
  code = '';

  constructor(
    private readonly dialogRef: MatDialogRef<JoinLeagueDialogComponent, string>,
    @Inject(MAT_DIALOG_DATA) readonly data: JoinLeagueDialogData
  ) {}

  submit(): void {
    const trimmed = this.code.trim();
    if (!trimmed) {
      return;
    }
    this.dialogRef.close(trimmed);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
