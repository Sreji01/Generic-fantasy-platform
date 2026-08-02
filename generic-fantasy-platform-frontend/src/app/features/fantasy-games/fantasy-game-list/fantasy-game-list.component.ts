import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { FantasyGameRequest, FantasyGameResponse } from '../../../core/models/fantasy-game.model';
import { FantasyGameFormDialogComponent } from '../fantasy-game-form-dialog/fantasy-game-form-dialog.component';

@Component({
  selector: 'app-fantasy-game-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './fantasy-game-list.component.html',
  styleUrl: './fantasy-game-list.component.scss'
})
export class FantasyGameListComponent implements OnInit {
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'description', 'createdBy', 'actions'];
  readonly fantasyGames = signal<FantasyGameResponse[]>([]);

  ngOnInit(): void {
    this.load();
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
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

    ref.afterClosed().subscribe((result: FantasyGameRequest | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyGameService.create(result).subscribe({
        next: (created) => {
          this.snackBar.open('Fantasy Game created. Now set up its field.', 'Close', { duration: 3000 });
          this.router.navigate(['/fantasy-games', created.id, 'field']);
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

    ref.afterClosed().subscribe((result: FantasyGameRequest | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyGameService.update(fantasyGame.id, result).subscribe({
        next: () => {
          this.snackBar.open('Fantasy Game updated.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to update fantasy game. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteFantasyGame(fantasyGame: FantasyGameResponse): void {
    if (!confirm(`Delete fantasy game "${fantasyGame.name}"?`)) {
      return;
    }

    this.fantasyGameService.delete(fantasyGame.id).subscribe({
      next: () => {
        this.snackBar.open('Fantasy Game deleted.', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Failed to delete fantasy game. You may not have permission.', 'Close', { duration: 4000 })
    });
  }

  private load(): void {
    this.fantasyGameService.getAll().subscribe((fantasyGames) => this.fantasyGames.set(fantasyGames));
  }
}
