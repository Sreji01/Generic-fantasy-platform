export interface FantasyTeamRequest {
  name: string;
  leagueId: number;
  playerIds: number[];
}

export interface FantasyTeamResponse {
  id: number;
  name: string;
  userId: number;
  username: string;
  leagueId: number;
  leagueName: string;
  totalPoints: number | null;
  createdAt: string;
  playerIds: number[];
}

export interface StandingEntry {
  rank: number;
  fantasyTeamId: number;
  fantasyTeamName: string;
  userId: number;
  username: string;
  totalPoints: number | null;
}
