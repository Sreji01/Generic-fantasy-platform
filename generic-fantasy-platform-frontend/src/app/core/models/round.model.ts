export type RoundStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

export interface RoundRequest {
  roundNumber: number;
  fantasyGameId: number;
  startDate?: string;
  endDate?: string;
  transferDeadline?: string;
  status: RoundStatus;
}

export interface RoundResponse {
  id: number;
  roundNumber: number;
  fantasyGameId: number;
  fantasyGameName: string;
  startDate: string | null;
  endDate: string | null;
  transferDeadline: string | null;
  status: RoundStatus;
}
