import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';

import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FantasyTeamService } from '../../../core/services/fantasy-team.service';
import { FantasyTeamResponse } from '../../../core/models/fantasy-team.model';

@Component({
  selector: 'app-my-teams',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './my-teams.component.html',
  styleUrl: './my-teams.component.scss'
})
export class MyTeamsComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly fantasyTeamService = inject(FantasyTeamService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);

  readonly displayedColumns = ['name', 'leagueName', 'playerCount', 'totalPoints', 'actions'];
  readonly teams = signal<FantasyTeamResponse[]>([]);

  ngOnInit(): void {
    this.load();
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
  }

  viewStandings(team: FantasyTeamResponse): void {
    this.router.navigate(['/leagues', team.leagueId, 'standings']);
  }

  viewTeam(team: FantasyTeamResponse): void {
    this.router.navigate(['/fantasy-teams', team.id]);
  }

  deleteTeam(team: FantasyTeamResponse): void {
    this.confirmDialog.confirm({ title: 'Delete Team', message: `Delete team "${team.name}"?` }).subscribe((confirmed) => {
      if (!confirmed) {
        return;
      }
      this.fantasyTeamService.delete(team.id).subscribe({
        next: () => {
          this.snackBar.open('Team deleted.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to delete team. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  private load(): void {
    this.fantasyTeamService.getMine().subscribe((teams) => this.teams.set(teams));
  }
}
