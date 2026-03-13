export interface Entity {
  id: number;
  cardId: string;
  tags: Map<GameTag, number>;
  zone: number;
  controller: number;
}

export type GameTag = number;

export interface Minion extends Entity {
  attack: number;
  health: number;
  damage: number;
  maxHealth: number;
  golden: boolean;
  tier: number;
  race: number;
  taunt: boolean;
  divineShield: boolean;
  poisonous: boolean;
  venomous: boolean;
  windfury: boolean;
  megaWindfury: boolean;
  stealth: boolean;
  reborn: boolean;
  cleave: boolean;
}

export interface HeroPower {
  cardId: string;
  isActivated: boolean;
  attachedMinionEntityId: number | null;
}

export interface Hero {
  cardId: string;
  entityId: number;
  health: number;
  armor: number;
  tier: number;
  heroPower: HeroPower;
}

export interface Quest {
  cardId: string;
  progress: number;
  progressTotal: number;
  rewardCardId: string;
}

export interface Trinket {
  cardId: string;
  isActive: boolean;
}

export interface Enchantment {
  cardId: string;
  sourceEntityId: number;
  targetEntityId: number;
}
