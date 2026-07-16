import { Component, OnInit, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { DomainService } from '../../../core/services/domain.service';
import { DomainRequest, DomainResponse } from '../../../core/models/domain.model';
import { DomainFormDialogComponent } from '../domain-form-dialog/domain-form-dialog.component';

@Component({
  selector: 'app-domain-list',
  standalone: true,
  imports: [MatButtonModule, MatIconModule, MatTableModule, MatToolbarModule],
  templateUrl: './domain-list.component.html',
  styleUrl: './domain-list.component.scss'
})
export class DomainListComponent implements OnInit {
  private readonly domainService = inject(DomainService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly displayedColumns = ['name', 'description', 'createdBy', 'actions'];
  readonly domains = signal<DomainResponse[]>([]);

  ngOnInit(): void {
    this.load();
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
  }

  canModify(domain: DomainResponse): boolean {
    const user = this.authService.currentUser();
    if (!user) {
      return false;
    }
    return user.role === 'ADMIN' || user.username === domain.createdByUsername;
  }

  openCreateDialog(): void {
    const ref = this.dialog.open(DomainFormDialogComponent, { data: null, width: '600px', maxWidth: '600px' });

    ref.afterClosed().subscribe((result: DomainRequest | undefined) => {
      if (!result) {
        return;
      }
      this.domainService.create(result).subscribe({
        next: (created) => {
          this.snackBar.open('Domain created. Now set up its field.', 'Close', { duration: 3000 });
          this.router.navigate(['/domains', created.id, 'field']);
        },
        error: () => this.snackBar.open('Failed to create domain.', 'Close', { duration: 3000 })
      });
    });
  }

  openFieldBuilder(domain: DomainResponse): void {
    this.router.navigate(['/domains', domain.id, 'field']);
  }

  openEditDialog(domain: DomainResponse): void {
    const ref = this.dialog.open(DomainFormDialogComponent, { data: domain, width: '600px', maxWidth: '600px' });

    ref.afterClosed().subscribe((result: DomainRequest | undefined) => {
      if (!result) {
        return;
      }
      this.domainService.update(domain.id, result).subscribe({
        next: () => {
          this.snackBar.open('Domain updated.', 'Close', { duration: 3000 });
          this.load();
        },
        error: () => this.snackBar.open('Failed to update domain. You may not have permission.', 'Close', { duration: 4000 })
      });
    });
  }

  deleteDomain(domain: DomainResponse): void {
    if (!confirm(`Delete domain "${domain.name}"?`)) {
      return;
    }

    this.domainService.delete(domain.id).subscribe({
      next: () => {
        this.snackBar.open('Domain deleted.', 'Close', { duration: 3000 });
        this.load();
      },
      error: () => this.snackBar.open('Failed to delete domain. You may not have permission.', 'Close', { duration: 4000 })
    });
  }

  private load(): void {
    this.domainService.getAll().subscribe((domains) => this.domains.set(domains));
  }
}
