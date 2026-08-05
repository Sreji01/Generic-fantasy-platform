import { UserRole } from './auth.model';

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  createdAt: string;
}

export interface UpdateUserRoleRequest {
  role: UserRole;
}

export interface AdminStatsResponse {
  userCount: number;
  fantasyGameCount: number;
  leagueCount: number;
  playerCount: number;
}
