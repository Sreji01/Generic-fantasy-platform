export type LeagueStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

export interface LeagueRequest {
  name: string;
  description?: string;
  fantasyGameId: number;
  startDate?: string;
  endDate?: string;
  status: LeagueStatus;
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
  participantCount: number;
  isPublic: boolean;
  joinCode: string | null;
}
