import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsArray,
  IsDateString,
  IsOptional,
  IsEnum,
  ValidateNested,
} from 'class-validator';

export class CreateOpponentDto {
  @IsInt()
  playerIdInGame!: number;

  @IsString()
  @IsNotEmpty()
  heroCardId!: string;

  @IsInt()
  @Min(1)
  @Max(6)
  tavernTier!: number;

  @IsArray()
  lastKnownBoard!: unknown[];

  @IsInt()
  @Min(0)
  damageDealt!: number;

  @IsInt()
  @Min(0)
  damageTaken!: number;
}

export class CreateTurnDto {
  @IsInt()
  @Min(1)
  turnNumber!: number;

  @IsInt()
  @Min(1)
  @Max(6)
  tavernTier!: number;

  @IsInt()
  health!: number;

  @IsArray()
  boardState!: unknown[];

  @IsEnum(['WIN', 'LOSS', 'TIE'])
  combatResult!: 'WIN' | 'LOSS' | 'TIE';

  @IsInt()
  damageDelta!: number;

  @IsDateString()
  timestamp!: string;
}

export class CreateMatchDataDto {
  @IsEnum(['SOLO', 'DUOS'])
  gameMode!: 'SOLO' | 'DUOS';

  @IsString()
  @IsNotEmpty()
  heroCardId!: string;

  @IsInt()
  @Min(1)
  @Max(8)
  placement!: number;

  @IsInt()
  mmrBefore!: number;

  @IsInt()
  mmrAfter!: number;

  @IsInt()
  @Min(1)
  turnCount!: number;

  @IsString()
  @IsOptional()
  anomalyCardId?: string;

  @IsArray()
  @IsInt({ each: true })
  availableRaces!: number[];

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;
}

export class CreateMatchDto {
  @ValidateNested()
  @Type(() => CreateMatchDataDto)
  matchData!: CreateMatchDataDto;

  @ValidateNested({ each: true })
  @Type(() => CreateOpponentDto)
  @IsArray()
  opponents!: CreateOpponentDto[];

  @ValidateNested({ each: true })
  @Type(() => CreateTurnDto)
  @IsArray()
  turns!: CreateTurnDto[];
}
