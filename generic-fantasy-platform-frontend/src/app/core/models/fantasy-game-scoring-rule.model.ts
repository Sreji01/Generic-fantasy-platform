export interface ScoringRulePositionValue {
  positionName: string;
  points: number;
}

export interface FantasyGameScoringRuleRequest {
  name: string;
  variesByPosition: boolean;
  points?: number;
  positionValues: ScoringRulePositionValue[];
}

export interface FantasyGameScoringRuleResponse extends FantasyGameScoringRuleRequest {
  id: number;
}
