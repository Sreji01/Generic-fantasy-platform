export interface ScoreRequest {
  fantasyTeamId: number;
  roundId: number;
  points?: number;
  pointsBreakdownJson?: string;
}

export interface ScoreResponse {
  id: number;
  fantasyTeamId: number;
  fantasyTeamName: string;
  roundId: number;
  points: number | null;
  pointsBreakdownJson: string | null;
}
