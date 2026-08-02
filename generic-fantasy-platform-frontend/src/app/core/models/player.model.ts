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
