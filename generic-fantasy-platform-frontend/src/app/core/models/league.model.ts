export type LeagueStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

export interface LeagueRequest {
  name: string;
  description?: string;
  domainId: number;
  startDate?: string;
  endDate?: string;
  status: LeagueStatus;
  maxPlayersPerTeam?: number;
  budget?: number;
}

export interface LeagueResponse {
  id: number;
  name: string;
  description: string | null;
  domainId: number;
  domainName: string;
  startDate: string | null;
  endDate: string | null;
  status: LeagueStatus;
  maxPlayersPerTeam: number | null;
  budget: number | null;
}
