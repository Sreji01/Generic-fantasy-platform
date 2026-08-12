export interface TeamLeagueSummary {
  id: number;
  name: string;
}

export interface FantasyTeamRequest {
  name: string;
  fantasyGameId: number;
  playerIds: number[];
}

export interface FantasyTeamResponse {
  id: number;
  name: string;
  userId: number;
  username: string;
  fantasyGameId: number;
  fantasyGameName: string;
  totalPoints: number | null;
  createdAt: string;
  playerIds: number[];
  leagues: TeamLeagueSummary[];
}

export interface StandingEntry {
  rank: number;
  fantasyTeamId: number;
  fantasyTeamName: string;
  userId: number;
  username: string;
  totalPoints: number | null;
}
