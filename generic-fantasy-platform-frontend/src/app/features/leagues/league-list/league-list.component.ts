import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { LeagueService } from '../../../core/services/league.service';
import { LeagueRequest, LeagueResponse } from '../../../core/models/league.model';
import { LeagueFormDialogComponent } from '../league-form-dialog/league-form-dialog.component';

@Component({
  selector: 'app-league-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './league-list.component.html',
  styleUrl: './league-list.component.scss'
})
export class LeagueListComponent implements OnInit {
  private readonly leagueService = inject(LeagueService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'domain', 'status', 'dates', 'actions'];
  readonly leagues = signal<LeagueResponse[]>([]);

  ngOnInit(): void {
    this.load();
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
  }

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ADMIN';
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(LeagueFormDialogComponent, { data: null, width: '480px' });

    ref.afterClosed().subscribe((result: LeagueRequest | undefined) => {
      if (!result) {
        return;
      }
      this.leagueService.create(result).subscribe({
        next: () => {
          this.snackBar.open('League created.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to create league.', 'Close', { duration: 3000 })
      });
    });
  }

  openEditDialog(league: LeagueResponse): void {
    const ref = this.dialog.open(LeagueFormDialogComponent, { data: league, width: '480px' });

    ref.afterClosed().subscribe((result: LeagueRequest | undefined) => {
      if (!result) {
        return;
      }
      this.leagueService.update(league.id, result).subscribe({
        next: () => {
          this.snackBar.open('League updated.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to update league. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteLeague(league: LeagueResponse): void {
    if (!confirm(`Delete league "${league.name}"?`)) {
      return;
    }

    this.leagueService.delete(league.id).subscribe({
      next: () => {
        this.snackBar.open('League deleted.', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Failed to delete league. You may not have permission.', 'Close', { duration: 4000 })
    });
  }

  private load(): void {
    this.leagueService.getAll().subscribe((leagues) => this.leagues.set(leagues));
  }
}
