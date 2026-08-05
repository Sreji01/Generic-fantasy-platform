import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { RoundService } from '../../../core/services/round.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { RoundRequest, RoundResponse } from '../../../core/models/round.model';
import { RoundFormDialogComponent, RoundFormDialogData } from '../round-form-dialog/round-form-dialog.component';

@Component({
  selector: 'app-round-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './round-list.component.html',
  styleUrl: './round-list.component.scss'
})
export class RoundListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly roundService = inject(RoundService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private fantasyGameId!: number;

  readonly displayedColumns = ['roundNumber', 'name', 'status', 'dates', 'actions'];
  readonly fantasyGameName = signal('');
  readonly rounds = signal<RoundResponse[]>([]);

  ngOnInit(): void {
    this.fantasyGameId = Number(this.route.snapshot.paramMap.get('id'));
    this.fantasyGameService.getById(this.fantasyGameId).subscribe((fantasyGame) => this.fantasyGameName.set(fantasyGame.name));
    this.load();
  }

  goBack(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId]);
  }

  enterResults(round: RoundResponse): void {
    this.router.navigate(['/rounds', round.id, 'results']);
  }

  openCreateDialog(): void {
    const data: RoundFormDialogData = { fantasyGameId: this.fantasyGameId };
    const ref = this.dialog.open(RoundFormDialogComponent, { data, width: '480px' });

    ref.afterClosed().subscribe((result: RoundRequest | undefined) => {
      if (!result) {
        return;
      }
      this.roundService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Round created.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to create round.', 'Close', { duration: 3000 })
      });
    });
  }

  openEditDialog(round: RoundResponse): void {
    const data: RoundFormDialogData = { ...round, fantasyGameId: this.fantasyGameId };
    const ref = this.dialog.open(RoundFormDialogComponent, { data, width: '480px' });

    ref.afterClosed().subscribe((result: RoundRequest | undefined) => {
      if (!result) {
        return;
      }
      this.roundService.update(round.id, result).subscribe({
        next: () => {
          this.snackBar.open('Round updated.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to update round.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteRound(round: RoundResponse): void {
    this.confirmDialog.confirm({ title: 'Delete Round', message: `Delete round "${round.name}"?` }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.roundService.delete(round.id).subscribe({
        next: () => {
          this.snackBar.open('Round deleted.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to delete round.', 'Close', { duration: 4000 })
      });
    });
  }

  private load(): void {
    this.roundService.getAll(this.fantasyGameId).subscribe((rounds) => this.rounds.set(rounds));
  }
}
