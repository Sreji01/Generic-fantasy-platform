import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { FantasyGameListComponent } from './features/fantasy-games/fantasy-game-list/fantasy-game-list.component';
import { FantasyGameDetailsComponent } from './features/fantasy-games/fantasy-game-details/fantasy-game-details.component';
import { FieldBuilderComponent } from './features/fantasy-games/field-builder/field-builder.component';
import { LeagueListComponent } from './features/leagues/league-list/league-list.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'fantasy-games', component: FantasyGameListComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:id/field', component: FieldBuilderComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:id', component: FantasyGameDetailsComponent, canActivate: [authGuard] },
  { path: 'leagues', component: LeagueListComponent, canActivate: [authGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
