import { FantasyGamePositionRequest, FantasyGamePositionResponse } from './fantasy-game-position.model';
import { FantasyGameScoringRuleRequest, FantasyGameScoringRuleResponse } from './fantasy-game-scoring-rule.model';

export interface FantasyGameRequest {
  name: string;
  description?: string;
  fieldRows: number;
  fieldCols: number;
  benchRows?: number;
  benchCols?: number;
  backgroundImageUrl?: string;
  thumbnailUrl?: string;
  scoringRules: FantasyGameScoringRuleRequest[];
  positions: FantasyGamePositionRequest[];
}

export interface FantasyGameResponse {
  id: number;
  name: string;
  description: string | null;
  fieldRows: number;
  fieldCols: number;
  benchRows: number | null;
  benchCols: number | null;
  backgroundImageUrl: string | null;
  thumbnailUrl: string | null;
  playerCount: number;
  scoringRules: FantasyGameScoringRuleResponse[];
  positions: FantasyGamePositionResponse[];
  createdById: number;
  createdByUsername: string;
}
