import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

import { FantasyGameService } from '../../core/services/fantasy-game.service';
import {
  FantasyGameFormDialogComponent,
  FantasyGameFormResult
} from '../fantasy-games/fantasy-game-form-dialog/fantasy-game-form-dialog.component';
import { PopularFantasyGamesComponent } from './popular-fantasy-games/popular-fantasy-games.component';
import { MyFantasyGamesComponent } from './my-fantasy-games/my-fantasy-games.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, PopularFantasyGamesComponent, MyFantasyGamesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  openCreateFantasyGameDialog(): void {
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
}
