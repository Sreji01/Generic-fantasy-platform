export interface PlayerRequest {
  firstName: string;
  lastName: string;
  position: string;
  realTeam?: string;
  price?: number;
  imageUrl?: string;
  fantasyGameId: number;
}

export interface PlayerResponse {
  id: number;
  firstName: string;
  lastName: string;
  position: string;
  realTeam: string | null;
  price: number | null;
  imageUrl: string | null;
  fantasyGameId: number;
}
