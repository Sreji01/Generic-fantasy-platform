export interface PlayerResultRequest {
  playerId: number;
  roundId: number;
  resultsJson?: string;
  pointsEarned?: number;
}

export interface PlayerResultResponse {
  id: number;
  playerId: number;
  playerName: string;
  roundId: number;
  resultsJson: string | null;
  pointsEarned: number | null;
}
