export type RoundStatus = 'UPCOMING' | 'ACTIVE' | 'FINISHED';

export interface RoundRequest {
  name: string;
  roundNumber: number;
  fantasyGameId: number;
  startDate?: string;
  endDate?: string;
  status: RoundStatus;
}

export interface RoundResponse {
  id: number;
  name: string;
  roundNumber: number;
  fantasyGameId: number;
  fantasyGameName: string;
  startDate: string | null;
  endDate: string | null;
  status: RoundStatus;
}
