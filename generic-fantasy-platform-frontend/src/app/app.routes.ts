import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { HomeComponent } from './features/home/home.component';
import { ProfileComponent } from './features/profile/profile.component';
import { FantasyGameListComponent } from './features/fantasy-games/fantasy-game-list/fantasy-game-list.component';
import { FantasyGameDetailsComponent } from './features/fantasy-games/fantasy-game-details/fantasy-game-details.component';
import { FieldBuilderComponent } from './features/fantasy-games/field-builder/field-builder.component';
import { PlayerListComponent } from './features/players/player-list/player-list.component';
import { LeagueListComponent } from './features/leagues/league-list/league-list.component';
import { BrowseLeaguesComponent } from './features/leagues/browse-leagues/browse-leagues.component';
import { LeagueStandingsComponent } from './features/leagues/league-standings/league-standings.component';
import { TeamBuilderComponent } from './features/leagues/team-builder/team-builder.component';
import { MyTeamsComponent } from './features/fantasy-teams/my-teams/my-teams.component';
import { TeamDetailComponent } from './features/fantasy-teams/team-detail/team-detail.component';
import { AdminComponent } from './features/admin/admin.component';
import { RoundListComponent } from './features/rounds/round-list/round-list.component';
import { RoundResultsComponent } from './features/rounds/round-results/round-results.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'home', component: HomeComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'fantasy-games', component: FantasyGameListComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:id/field', component: FieldBuilderComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:id/players', component: PlayerListComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:id/rounds', component: RoundListComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:id', component: FantasyGameDetailsComponent, canActivate: [authGuard] },
  { path: 'rounds/:id/results', component: RoundResultsComponent, canActivate: [authGuard] },
  { path: 'leagues', component: LeagueListComponent, canActivate: [authGuard] },
  { path: 'leagues/browse', component: BrowseLeaguesComponent, canActivate: [authGuard] },
  { path: 'leagues/:id/standings', component: LeagueStandingsComponent, canActivate: [authGuard] },
  { path: 'fantasy-games/:fantasyGameId/team-builder', component: TeamBuilderComponent, canActivate: [authGuard] },
  { path: 'my-teams', component: MyTeamsComponent, canActivate: [authGuard] },
  { path: 'fantasy-teams/:id', component: TeamDetailComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent, canActivate: [authGuard, adminGuard] },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: '**', redirectTo: 'home' }
];
