import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../../core/services/auth.service';
import { DomainService } from '../../../core/services/domain.service';
import { LeagueService } from '../../../core/services/league.service';
import { DomainRequest, DomainResponse } from '../../../core/models/domain.model';
import { LeagueRequest, LeagueResponse } from '../../../core/models/league.model';
import { DomainFormDialogComponent } from '../domain-form-dialog/domain-form-dialog.component';
import { LeagueFormDialogComponent } from '../../leagues/league-form-dialog/league-form-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-domain-details',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatToolbarModule],
  templateUrl: './domain-details.component.html',
  styleUrl: './domain-details.component.scss'
})
export class DomainDetailsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly domainService = inject(DomainService);
  private readonly leagueService = inject(LeagueService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  private domainId!: number;

  readonly domain = signal<DomainResponse | null>(null);
  readonly leagues = signal<LeagueResponse[]>([]);
  readonly popularLeagues = computed(() => [...this.leagues()].sort((a, b) => b.participantCount - a.participantCount));

  readonly thumbnailDisplayUrl = computed(() => {
    const url = this.domain()?.thumbnailUrl;
    return url ? `${environment.apiUrl}${url}` : null;
  });

  readonly canManage = computed(() => {
    const user = this.authService.currentUser();
    const domain = this.domain();
    if (!user || !domain) {
      return false;
    }
    return user.role === 'ADMIN' || user.username === domain.createdByUsername;
  });

  ngOnInit(): void {
    this.domainId = Number(this.route.snapshot.paramMap.get('id'));
    this.domainService.getById(this.domainId).subscribe((domain) => this.domain.set(domain));
    this.loadLeagues();
  }

  manageField(): void {
    this.router.navigate(['/domains', this.domainId, 'field']);
  }

  goBack(): void {
    this.router.navigateByUrl('/home');
  }

  openEditDialog(): void {
    const domain = this.domain();
    if (!domain) {
      return;
    }

    const ref = this.dialog.open(DomainFormDialogComponent, { data: domain, width: '600px', maxWidth: '600px' });

    ref.afterClosed().subscribe((result: DomainRequest | undefined) => {
      if (!result) {
        return;
      }
      this.domainService.update(domain.id, result).subscribe({
        next: (updated) => {
          this.domain.set(updated);
          this.snackBar.open('Domain updated.', 'Close', { duration: 3000 });
        },
        error: () => this.snackBar.open('Failed to update domain. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteDomain(): void {
    const domain = this.domain();
    if (!domain || !confirm(`Delete domain "${domain.name}"?`)) {
      return;
    }

    this.domainService.delete(domain.id).subscribe({
      next: () => {
        this.snackBar.open('Domain deleted.', 'Close', { duration: 3000 });
        this.router.navigateByUrl('/domains');
      },
      error: () => this.snackBar.open('Failed to delete domain. You may not have permission.', 'Close', { duration: 4000 })
    });
  }

  openCreateLeagueDialog(): void {
    const ref = this.dialog.open(LeagueFormDialogComponent, { data: { domainId: this.domainId }, width: '480px' });

    ref.afterClosed().subscribe((result: LeagueRequest | undefined) => {
      if (!result) {
        return;
      }
      this.leagueService.create(result).subscribe({
        next: () => {
          this.snackBar.open('League created.', 'Close', { duration: 3000 });
          this.loadLeagues();
        },
        error: () => this.snackBar.open('Failed to create league.', 'Close', { duration: 3000 })
      });
    });
  }

  private loadLeagues(): void {
    this.leagueService.getAll(this.domainId).subscribe((leagues) => this.leagues.set(leagues));
  }
}
