export interface DomainPositionRequest {
  name: string;
  playerCount: number;
  xPosition: number;
  yPosition: number;
}

export interface DomainPositionResponse extends DomainPositionRequest {
  id: number;
}
