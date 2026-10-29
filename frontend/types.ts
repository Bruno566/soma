export interface Player {
  id: number;
  name: string;
  balance: number;
  initialBalance: number;
  color: string;
  avatarBg: string;
  forcedAllIn: boolean;
  bankrupt: boolean;
  isAi?: boolean;
  sabotagesUsed: number;
  sabotagesSuffered: number;
  pendingSabotageNotice: SabotageNotice | null;
}

export interface SabotageNotice {
  attackerName: string;
  effectDesc: string;
}

export type SabotageType = 'STEAL_20' | 'FORCE_ALL_IN' | 'FEE_1000' | 'CURSE_NEXT_ROLL';

export interface SecretEffect {
  type: 'MULT_GAIN' | 'FIXED_GAIN' | 'FIXED_LOSS' | 'PERCENT_LOSS';
  val: number;
  desc: string;
  badge: string;
}

export interface RollOutcome {
  change: number;
  percentageText: string;
  message: string;
  isGain: boolean;
  isNeutral: boolean;
}

export interface GameLog {
  id: string;
  round: number;
  playerName: string;
  sum: number;
  dice: [number, number];
  bet: number;
  change: number;
  resultMessage: string;
  timestamp: string;
  type: 'roll' | 'sabotage' | 'code' | 'ai';
}
