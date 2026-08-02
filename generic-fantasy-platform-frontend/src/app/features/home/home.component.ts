import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../core/services/auth.service';
import { FantasyGameService } from '../../core/services/fantasy-game.service';
import { FantasyGameRequest } from '../../core/models/fantasy-game.model';
import { FantasyGameFormDialogComponent } from '../fantasy-games/fantasy-game-form-dialog/fantasy-game-form-dialog.component';
import { PopularFantasyGamesComponent } from './popular-fantasy-games/popular-fantasy-games.component';
import { MyFantasyGamesComponent } from './my-fantasy-games/my-fantasy-games.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    RouterLink,
    PopularFantasyGamesComponent,
    MyFantasyGamesComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  private readonly authService = inject(AuthService);
  private readonly fantasyGameService = inject(FantasyGameService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.currentUser;

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  openCreateFantasyGameDialog(): void {
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
}
