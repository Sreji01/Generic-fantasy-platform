export type LeagueStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

export interface LeagueRequest {
  name: string;
  description?: string;
  fantasyGameId: number;
  startDate?: string;
  endDate?: string;
  status: LeagueStatus;
  maxPlayersPerTeam?: number;
  isPublic?: boolean;
}

export interface LeagueResponse {
  id: number;
  name: string;
  description: string | null;
  fantasyGameId: number;
  fantasyGameName: string;
  startDate: string | null;
  endDate: string | null;
  status: LeagueStatus;
  maxPlayersPerTeam: number | null;
  participantCount: number;
  isPublic: boolean;
}
