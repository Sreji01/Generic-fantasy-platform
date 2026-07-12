export interface DomainScoringRuleRequest {
  name: string;
  points: number;
}

export interface DomainScoringRuleResponse extends DomainScoringRuleRequest {
  id: number;
}
