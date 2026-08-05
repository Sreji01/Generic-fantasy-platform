import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/auth.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { AdminService } from '../../core/services/admin.service';
import { UserRole } from '../../core/models/auth.model';
import { AdminStatsResponse, UserResponse } from '../../core/models/admin.model';

const DEFAULT_PAGE_SIZE = 10;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatSelectModule,
    MatTableModule,
    MatToolbarModule,
    MatTooltipModule
  ],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly router = inject(Router);

  readonly displayedColumns = ['username', 'email', 'role', 'createdAt', 'actions'];
  readonly roles: UserRole[] = ['USER', 'ADMIN'];

  readonly stats = signal<AdminStatsResponse | null>(null);
  readonly users = signal<UserResponse[]>([]);

  readonly searchTerm = signal('');
  readonly pageIndex = signal(0);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  readonly currentUsername = computed(() => this.authService.currentUser()?.username);

  readonly filteredUsers = computed(() => {
    const term = this.searchTerm().trim().toLowerCase();
    if (!term) {
      return this.users();
    }
    return this.users().filter(
      (user) => user.username.toLowerCase().includes(term) || user.email.toLowerCase().includes(term)
    );
  });

  readonly pagedUsers = computed(() => {
    const start = this.pageIndex() * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  ngOnInit(): void {
    this.loadStats();
    this.loadUsers();
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

  isSelf(user: UserResponse): boolean {
    return user.username === this.currentUsername();
  }

  onRoleChange(user: UserResponse, role: UserRole): void {
    if (role === user.role) {
      return;
    }
    this.adminService.updateUserRole(user.id, { role }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.snackBar.open(`Role updated for ${updated.username}.`, 'Close', { duration: 3000 });
      },
      error: () => {
        this.snackBar.open('Failed to update role.', 'Close', { duration: 3000 });
        this.loadUsers();
      }
    });
  }

  deleteUser(user: UserResponse): void {
    this.confirmDialog
      .confirm({ title: 'Delete User', message: `Delete user "${user.username}"? This cannot be undone.` })
      .subscribe((confirmed) => {
        if (!confirmed) {
          return;
        }
        this.adminService.deleteUser(user.id).subscribe({
          next: () => {
            this.snackBar.open('User deleted.', 'Close', { duration: 3000 });
            this.loadUsers();
            this.loadStats();
          },
          error: () => this.snackBar.open('Failed to delete user.', 'Close', { duration: 3000 })
        });
      });
  }

  private loadStats(): void {
    this.adminService.getStats().subscribe((stats) => this.stats.set(stats));
  }

  private loadUsers(): void {
    this.adminService.getAllUsers().subscribe((users) => this.users.set(users));
  }
}
