export interface Model {
  _id: string;
  url: string;
  name: string;
  description: string;
  modelId: string;
  modelName: string;
  modelUsername: string;
  createdAt: Date;
  isActive: boolean;
  averageScore: number | null;
  timesRated: number;
  wins: number;
  losses: number;
  winRate: number;
  elo: number;
  lastOpponents: LastOpponent[];
  updatedAt: Date;
}

export interface LastOpponent {
  id: string;
  modelId: string;
  elo: number;
  result: 'win' | 'loss';
  timestamp: Date;
}

export interface Vote {
  userId: string;
  winnerId: string;
  loserId: string;
  createdAt: Date;
} 