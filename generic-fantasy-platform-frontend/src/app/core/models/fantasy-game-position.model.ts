import { PositionSlotRequest, PositionSlotResponse } from './position-slot.model';

export interface DomainPositionRequest {
  name: string;
  slots: PositionSlotRequest[];
}

export interface DomainPositionResponse {
  id: number;
  name: string;
  slots: PositionSlotResponse[];
}
