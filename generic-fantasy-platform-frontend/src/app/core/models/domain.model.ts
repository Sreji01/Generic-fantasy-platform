import { DomainPositionRequest, DomainPositionResponse } from './domain-position.model';
import { DomainScoringRuleRequest, DomainScoringRuleResponse } from './domain-scoring-rule.model';

export interface DomainRequest {
  name: string;
  description?: string;
  fieldRows: number;
  fieldCols: number;
  backgroundImageUrl?: string;
  thumbnailUrl?: string;
  scoringRules: DomainScoringRuleRequest[];
  positions: DomainPositionRequest[];
}

export interface DomainResponse {
  id: number;
  name: string;
  description: string | null;
  fieldRows: number;
  fieldCols: number;
  backgroundImageUrl: string | null;
  thumbnailUrl: string | null;
  playerCount: number;
  scoringRules: DomainScoringRuleResponse[];
  positions: DomainPositionResponse[];
  createdById: number;
  createdByUsername: string;
}
