import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    FormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatToolbarModule,
    RouterLink
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  readonly currentUser = this.authService.currentUser;

  readonly editingUsername = signal(false);
  usernameInput = '';
  readonly savingUsername = signal(false);

  readonly editingPassword = signal(false);
  currentPasswordInput = '';
  newPasswordInput = '';
  confirmPasswordInput = '';
  readonly savingPassword = signal(false);

  isAdmin(): boolean {
    return this.authService.currentUser()?.role === 'ADMIN';
  }

  goHome(): void {
    this.router.navigateByUrl('/home');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/login');
  }

  startEditUsername(): void {
    this.usernameInput = this.currentUser()?.username ?? '';
    this.editingUsername.set(true);
  }

  cancelEditUsername(): void {
    this.editingUsername.set(false);
  }

  saveUsername(): void {
    const username = this.usernameInput.trim();
    if (!username || this.savingUsername()) {
      return;
    }

    this.savingUsername.set(true);
    this.authService.updateUsername({ username }).subscribe({
      next: () => {
        this.savingUsername.set(false);
        this.editingUsername.set(false);
        this.snackBar.open('Username updated.', 'Close', { duration: 3000 });
      },
      error: (err) => {
        this.savingUsername.set(false);
        const message = err?.error?.message ?? 'Failed to update username.';
        this.snackBar.open(message, 'Close', { duration: 4000 });
      }
    });
  }

  startEditPassword(): void {
    this.currentPasswordInput = '';
    this.newPasswordInput = '';
    this.confirmPasswordInput = '';
    this.editingPassword.set(true);
  }

  cancelEditPassword(): void {
    this.editingPassword.set(false);
  }

  canSavePassword(): boolean {
    return (
      this.currentPasswordInput.length > 0 &&
      this.newPasswordInput.length >= 8 &&
      this.newPasswordInput === this.confirmPasswordInput
    );
  }

  savePassword(): void {
    if (!this.canSavePassword() || this.savingPassword()) {
      return;
    }

    this.savingPassword.set(true);
    this.authService
      .changePassword({ currentPassword: this.currentPasswordInput, newPassword: this.newPasswordInput })
      .subscribe({
        next: () => {
          this.savingPassword.set(false);
          this.editingPassword.set(false);
          this.snackBar.open('Password updated.', 'Close', { duration: 3000 });
        },
        error: (err) => {
          this.savingPassword.set(false);
          const message = err?.error?.message ?? 'Failed to update password.';
          this.snackBar.open(message, 'Close', { duration: 4000 });
        }
      });
  }
}
