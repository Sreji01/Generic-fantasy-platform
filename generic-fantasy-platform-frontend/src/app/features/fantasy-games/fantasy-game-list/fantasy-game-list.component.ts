import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import {
  FantasyGameFormDialogComponent,
  FantasyGameFormResult
} from '../fantasy-game-form-dialog/fantasy-game-form-dialog.component';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-fantasy-game-list',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatTableModule,
    MatToolbarModule
  ],
  templateUrl: './fantasy-game-list.component.html',
  styleUrl: './fantasy-game-list.component.scss'
})
export class FantasyGameListComponent implements OnInit {
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'description', 'createdBy', 'actions'];
  readonly fantasyGames = signal<FantasyGameResponse[]>([]);

  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly filteredFantasyGames = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.fantasyGames();
    }
    return this.fantasyGames().filter(
      (fantasyGame) =>
        fantasyGame.name.toLowerCase().includes(term) ||
        (fantasyGame.description ?? '').toLowerCase().includes(term)
    );
  });

  readonly pagedFantasyGames = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredFantasyGames().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.load();
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  canModify(fantasyGame: FantasyGameResponse): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }
    return user.role === 'ADMIN' || user.username === fantasyGame.createdByUsername;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(FantasyGameFormDialogComponent, { data: null, width: '600px', maxWidth: '600px' });

    ref.afterClosed().subscribe((result: FantasyGameFormResult | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyGameService.create(result.request).subscribe({
        next: (created) => {
          const proceed = () => {
            this.snackBar.open('Fantasy Game created. Now set up its field.', 'Close', { duration: 3000 });
            this.router.navigate(['/fantasy-games', created.id, 'field']);
          };
          if (result.thumbnailFile) {
            this.fantasyGameService.uploadThumbnailImage(created.id, result.thumbnailFile).subscribe({
              next: proceed,
              error: proceed
            });
          } else {
            proceed();
          }
        },
        error: () => this.snackBar.open('Failed to create fantasy game.', 'Close', { duration: 3000 })
      });
    });
  }

  openFieldBuilder(fantasyGame: FantasyGameResponse): void {
    this.router.navigate(['/fantasy-games', fantasyGame.id, 'field']);
  }

  openDetails(fantasyGame: FantasyGameResponse): void {
    this.router.navigate(['/fantasy-games', fantasyGame.id]);
  }

  openEditDialog(fantasyGame: FantasyGameResponse): void {
    const ref = this.dialog.open(FantasyGameFormDialogComponent, { data: fantasyGame, width: '600px', maxWidth: '600px' });

    ref.afterClosed().subscribe((result: FantasyGameFormResult | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyGameService.update(fantasyGame.id, result.request).subscribe({
        next: () => {
          const proceed = () => {
            this.snackBar.open('Fantasy Game updated.', 'Close', { duration: 3000 });
            this.load();
          };
          if (result.thumbnailFile) {
            this.fantasyGameService.uploadThumbnailImage(fantasyGame.id, result.thumbnailFile).subscribe({
              next: proceed,
              error: proceed
            });
          } else {
            proceed();
          }
        },
        error: () => this.snackBar.open('Failed to update fantasy game. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteFantasyGame(fantasyGame: FantasyGameResponse): void {
    this.confirmDialog
      .confirm({ title: 'Delete Fantasy Game', message: `Delete fantasy game "${fantasyGame.name}"?` })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.fantasyGameService.delete(fantasyGame.id).subscribe({
          next: () => {
            this.snackBar.open('Fantasy Game deleted.', 'Close', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Failed to delete fantasy game. You may not have permission.', 'Close', { duration: 4000 })
        });
      });
  }

  private load(): void {
    this.fantasyGameService.getAll().subscribe((fantasyGames) => this.fantasyGames.set(fantasyGames));
  }
}
