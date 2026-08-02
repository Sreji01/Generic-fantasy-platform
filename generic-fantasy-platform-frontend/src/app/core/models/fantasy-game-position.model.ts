import { PositionSlotRequest, PositionSlotResponse } from './position-slot.model';

export interface FantasyGamePositionRequest {
  name: string;
  slots: PositionSlotRequest[];
}

export interface FantasyGamePositionResponse {
  id: number;
  name: string;
  slots: PositionSlotResponse[];
}
