import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { RoundService } from '../../../core/services/round.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { RoundRequest, RoundResponse } from '../../../core/models/round.model';
import { GenerateRoundsDialogComponent } from '../generate-rounds-dialog/generate-rounds-dialog.component';
import { RoundFormDialogComponent, RoundFormDialogData } from '../round-form-dialog/round-form-dialog.component';

@Component({
  selector: 'app-round-list',
  standalone: true,
  imports: [DatePipe, MatButtonModule, MatCheckboxModule, MatIconModule, MatTableModule, MatToolbarModule],
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

  readonly displayedColumns = ['select', 'roundNumber', 'status', 'dates', 'transferDeadline', 'actions'];
  readonly fantasyGameName = signal('');
  readonly rounds = signal<RoundResponse[]>([]);
  readonly selectedIds = signal<Set<number>>(new Set());

  readonly allSelected = computed(() => this.rounds().length > 0 && this.rounds().every((r) => this.selectedIds().has(r.id)));
  readonly someSelected = computed(() => this.selectedIds().size > 0 && !this.allSelected());

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

  openGenerateDialog(): void {
    const ref = this.dialog.open(GenerateRoundsDialogComponent, { width: '400px' });

    ref.afterClosed().subscribe((count: number | undefined) => {
      if (!count) {
        return;
      }
      const startNumber = this.rounds().reduce((max, r) => Math.max(max, r.roundNumber), 0) + 1;
      const requests: RoundRequest[] = Array.from({ length: count }, (_, i) => ({
        roundNumber: startNumber + i,
        fantasyGameId: this.fantasyGameId,
        status: 'UPCOMING'
      }));

      forkJoin(requests.map((request) => this.roundService.create(request))).subscribe({
        next: () => {
          this.snackBar.open(`${count} rounds created.`, 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to generate rounds.', 'Close', { duration: 4000 })
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
    this.confirmDialog.confirm({ title: 'Delete Round', message: `Delete round "Round ${round.roundNumber}"?` }).subscribe((confirmed) => {
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

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  toggleSelected(id: number): void {
    this.selectedIds.update((ids) => {
      const next = new Set(ids);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  toggleSelectAll(): void {
    this.selectedIds.set(this.allSelected() ? new Set() : new Set(this.rounds().map((r) => r.id)));
  }

  deleteSelected(): void {
    const ids = Array.from(this.selectedIds());
    if (ids.length === 0) {
      return;
    }
    this.confirmDialog
      .confirm({ title: 'Delete Rounds', message: `Delete ${ids.length} selected round${ids.length > 1 ? 's' : ''}?` })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        forkJoin(ids.map((id) => this.roundService.delete(id))).subscribe({
          next: () => {
            this.snackBar.open(`${ids.length} round${ids.length > 1 ? 's' : ''} deleted.`, 'Close', { duration: 3000 });
            this.selectedIds.set(new Set());
            this.load();
          },
          error: () => this.snackBar.open('Failed to delete selected rounds.', 'Close', { duration: 4000 })
        });
      });
  }

  private load(): void {
    this.roundService.getAll(this.fantasyGameId).subscribe((rounds) => {
      this.rounds.set([...rounds].sort((a, b) => a.roundNumber - b.roundNumber));
      this.selectedIds.set(new Set());
    });
  }
}
