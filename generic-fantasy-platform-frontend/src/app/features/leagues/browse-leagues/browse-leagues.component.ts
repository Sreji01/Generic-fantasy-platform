import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { LeagueService } from '../../../core/services/league.service';
import { FantasyTeamRequest } from '../../../core/models/fantasy-team.model';
import { LeagueResponse } from '../../../core/models/league.model';
import { JoinLeagueDialogComponent, JoinLeagueDialogData } from '../join-league-dialog/join-league-dialog.component';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-browse-leagues',
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
  templateUrl: './browse-leagues.component.html',
  styleUrl: './browse-leagues.component.scss'
})
export class BrowseLeaguesComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly leagueService = inject(LeagueService);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'fantasyGame', 'status', 'participants', 'actions'];
  readonly leagues = signal<LeagueResponse[]>([]);
  readonly joinedLeagueIds = signal<Set<number>>(new Set());

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

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  isJoined(league: LeagueResponse): boolean {
    return this.joinedLeagueIds().has(league.id);
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.pageIndex.set(0);
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }

  joinLeague(league: LeagueResponse): void {
    const data: JoinLeagueDialogData = {
      fantasyGameId: league.fantasyGameId,
      leagues: [league],
      preselectedLeagueId: league.id
    };
    const ref = this.dialog.open(JoinLeagueDialogComponent, { data, width: '480px' });

    ref.afterClosed().subscribe((result: FantasyTeamRequest | undefined) => {
      if (!result) {
        return;
      }
      this.fantasyTeamService.create(result).subscribe({
        next: () => {
          this.snackBar.open('Team created!', 'Close', { duration: 3000 });
          this.load();
        },
        error: (err) => {
          const message = err?.error?.message ?? 'Failed to create team.';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        }
      });
    });
  }

  private load(): void {
    forkJoin({
      leagues: this.leagueService.getAll(),
      myTeams: this.fantasyTeamService.getMine()
    }).subscribe(({ leagues, myTeams }) => {
      this.leagues.set(leagues.filter((l) => l.isPublic));
      this.joinedLeagueIds.set(new Set(myTeams.map((t) => t.leagueId)));
    });
  }
}
