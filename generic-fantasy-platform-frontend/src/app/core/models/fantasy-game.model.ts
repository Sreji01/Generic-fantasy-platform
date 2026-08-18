import { FantasyGamePositionRequest, FantasyGamePositionResponse } from './fantasy-game-position.model';
import { FantasyGameScoringRuleRequest, FantasyGameScoringRuleResponse } from './fantasy-game-scoring-rule.model';

export interface FantasyGameRequest {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  fieldRows: number;
  fieldCols: number;
  benchRows?: number;
  benchCols?: number;
  pickFieldRows?: number;
  pickFieldCols?: number;
  pickBenchRows?: number;
  pickBenchCols?: number;
  budget?: number;
  currency?: string;
  backgroundImageUrl?: string;
  benchBackgroundImageUrl?: string;
  thumbnailUrl?: string;
  scoringRules: FantasyGameScoringRuleRequest[];
  positions: FantasyGamePositionRequest[];
  pickPositions: FantasyGamePositionRequest[];
}

export interface FantasyGameResponse {
  id: number;
  name: string;
  description: string | null;
  startDate: string | null;
  endDate: string | null;
  fieldRows: number;
  fieldCols: number;
  benchRows: number | null;
  benchCols: number | null;
  pickFieldRows: number | null;
  pickFieldCols: number | null;
  pickBenchRows: number | null;
  pickBenchCols: number | null;
  budget: number | null;
  currency: string | null;
  backgroundImageUrl: string | null;
  benchBackgroundImageUrl: string | null;
  thumbnailUrl: string | null;
  playerCount: number;
  scoringRules: FantasyGameScoringRuleResponse[];
  positions: FantasyGamePositionResponse[];
  pickPositions: FantasyGamePositionResponse[];
  createdById: number;
  createdByUsername: string;
}
