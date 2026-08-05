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
import { LeagueService } from '../../../core/services/league.service';
import { LeagueRequest, LeagueResponse } from '../../../core/models/league.model';
import { LeagueFormDialogComponent } from '../league-form-dialog/league-form-dialog.component';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-league-list',
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
  templateUrl: './league-list.component.html',
  styleUrl: './league-list.component.scss'
})
export class LeagueListComponent implements OnInit {
  private readonly leagueService = inject(LeagueService);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'fantasyGame', 'status', 'dates', 'actions'];
  readonly leagues = signal<LeagueResponse[]>([]);

  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly filteredLeagues = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.leagues();
    }
    return this.leagues().filter(
      (league) => league.name.toLowerCase().includes(term) || league.fantasyGameName.toLowerCase().includes(term)
    );
  });

  readonly pagedLeagues = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredLeagues().slice(start, start + this.pageSize());
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
    this.confirmDialog.confirm({ title: 'Delete League', message: `Delete league "${league.name}"?` }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.leagueService.delete(league.id).subscribe({
        next: () => {
          this.snackBar.open('League deleted.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to delete league. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  private load(): void {
    this.leagueService.getAll().subscribe((leagues) => this.leagues.set(leagues));
  }
}
