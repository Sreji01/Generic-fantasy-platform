import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { PlayerService } from '../../../core/services/player.service';
import { FantasyGameService } from '../../../core/services/fantasy-game.service';
import { PlayerResponse } from '../../../core/models/player.model';
import { PlayerFormDialogComponent, PlayerFormResult } from '../player-form-dialog/player-form-dialog.component';
import { environment } from '../../../../environments/environment';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-player-list',
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
  templateUrl: './player-list.component.html',
  styleUrl: './player-list.component.scss'
})
export class PlayerListComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly playerService = inject(PlayerService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private fantasyGameId!: number;

  private static readonly BASE_COLUMNS = ['photo', 'firstName', 'lastName', 'position', 'realTeam', 'price'];
  readonly fantasyGameName = signal('');
  readonly createdByUsername = signal('');
  readonly positionNames = signal<string[]>([]);
  readonly currency = signal<string | null>(null);
  readonly players = signal<PlayerResponse[]>([]);

  readonly currencyLabel = computed(() => {
    const currency = this.currency();
    return currency ? ` ${currency}` : '';
  });

  readonly canManage = computed(() => {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }
    return user.role === 'ADMIN' || user.username === this.createdByUsername();
  });

  readonly displayedColumns = computed(() =>
    this.canManage() ? [...PlayerListComponent.BASE_COLUMNS, 'actions'] : PlayerListComponent.BASE_COLUMNS
  );

  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly filteredPlayers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.players();
    }
    return this.players().filter(
      (player) =>
        `${player.firstName} ${player.lastName}`.toLowerCase().includes(term) ||
        player.position.toLowerCase().includes(term) ||
        (player.realTeam ?? '').toLowerCase().includes(term)
    );
  });

  readonly pagedPlayers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredPlayers().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.fantasyGameId = Number(this.route.snapshot.paramMap.get('id'));
    this.fantasyGameService.getById(this.fantasyGameId).subscribe((fantasyGame) => {
      this.fantasyGameName.set(fantasyGame.name);
      this.createdByUsername.set(fantasyGame.createdByUsername);
      this.positionNames.set(fantasyGame.positions.map((p) => p.name));
      this.currency.set(fantasyGame.currency);
    });
    this.load();
  }

  goBack(): void {
    this.router.navigate(['/fantasy-games', this.fantasyGameId]);
  }

  playerPhotoUrl(player: PlayerResponse): string | null {
    return player.imageUrl ? `${environment.apiUrl}${player.imageUrl}` : null;
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(PlayerFormDialogComponent, {
      data: { fantasyGameId: this.fantasyGameId, positions: this.positionNames() },
      width: '480px'
    });

    ref.afterClosed().subscribe((result: PlayerFormResult | undefined) => {
      if (!result) {
        return;
      }
      this.playerService.create(result.request).subscribe({
        next: (created) => {
          const proceed = () => {
            this.snackBar.open('Player added.', 'Close', { duration: 3000 });
            this.load();
          };
          if (result.imageFile) {
            this.playerService.uploadImage(created.id, result.imageFile).subscribe({ next: proceed, error: proceed });
          } else {
            proceed();
          }
        },
        error: () => this.snackBar.open('Failed to add player.', 'Close', { duration: 3000 })
      });
    });
  }

  openEditDialog(player: PlayerResponse): void {
    const ref = this.dialog.open(PlayerFormDialogComponent, {
      data: { ...player, positions: this.positionNames() },
      width: '480px'
    });

    ref.afterClosed().subscribe((result: PlayerFormResult | undefined) => {
      if (!result) {
        return;
      }
      this.playerService.update(player.id, result.request).subscribe({
        next: () => {
          this.snackBar.open('Player updated.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to update player.', 'Close', { duration: 4000 })
      });
    });
  }

  deletePlayer(player: PlayerResponse): void {
    this.confirmDialog
      .confirm({ title: 'Delete Player', message: `Delete player "${player.firstName} ${player.lastName}"?` })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.playerService.delete(player.id).subscribe({
          next: () => {
            this.snackBar.open('Player deleted.', 'Close', { duration: 3000 });
            this.load();
          },
          error: () => this.snackBar.open('Failed to delete player.', 'Close', { duration: 4000 })
        });
      });
  }

  private load(): void {
    this.playerService.getAll(this.fantasyGameId).subscribe((players) => this.players.set(players));
  }
}
