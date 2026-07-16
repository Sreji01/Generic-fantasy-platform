export interface PositionSlotRequest {
  rowIndex: number;
  colIndex: number;
}

export interface PositionSlotResponse extends PositionSlotRequest {
  id: number;
}
