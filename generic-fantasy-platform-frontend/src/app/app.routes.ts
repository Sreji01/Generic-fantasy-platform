import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { DomainListComponent } from './features/domains/domain-list/domain-list.component';
import { FieldBuilderComponent } from './features/domains/field-builder/field-builder.component';
import { LeagueListComponent } from './features/leagues/league-list/league-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'domains', component: DomainListComponent, canActivate: [authGuard] },
  { path: 'domains/:id/field', component: FieldBuilderComponent, canActivate: [authGuard] },
  { path: 'leagues', component: LeagueListComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
