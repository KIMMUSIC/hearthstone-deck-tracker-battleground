import { IsString, MinLength } from 'class-validator';

export class RegisterClientDto {
  @IsString()
  @MinLength(32)
  clientSecret!: string;
}
