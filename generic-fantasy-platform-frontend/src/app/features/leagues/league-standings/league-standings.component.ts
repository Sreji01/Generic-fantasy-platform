import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { LeagueService } from '../../../core/services/league.service';
import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { LeagueResponse } from '../../../core/models/league.model';
import { StandingEntry } from '../../../core/models/fantasy-team.model';

@Component({
  selector: 'app-league-standings',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './league-standings.component.html',
  styleUrl: './league-standings.component.scss'
})
export class LeagueStandingsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leagueService = inject(LeagueService);
  private readonly fantasyTeamService = inject(FantasyTeamService);

  private leagueId!: number;

  readonly displayedColumns = ['rank', 'fantasyTeamName', 'username', 'totalPoints'];
  readonly league = signal<LeagueResponse | null>(null);
  readonly standings = signal<StandingEntry[]>([]);

  ngOnInit(): void {
    this.leagueId = Number(this.route.snapshot.paramMap.get('id'));
    this.leagueService.getById(this.leagueId).subscribe((league) => this.league.set(league));
    this.fantasyTeamService.getStandings(this.leagueId).subscribe((standings) => this.standings.set(standings));
  }

  goBack(): void {
    const league = this.league();
    if (league) {
      this.router.navigate(['/fantasy-games', league.fantasyGameId]);
    } else {
      this.router.navigateByUrl('/home');
    }
  }
}
