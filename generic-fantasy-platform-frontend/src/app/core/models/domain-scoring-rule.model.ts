export interface ScoringRulePositionValue {
  positionName: string;
  points: number;
}

export interface DomainScoringRuleRequest {
  name: string;
  variesByPosition: boolean;
  points?: number;
  positionValues: ScoringRulePositionValue[];
}

export interface DomainScoringRuleResponse extends DomainScoringRuleRequest {
  id: number;
}
