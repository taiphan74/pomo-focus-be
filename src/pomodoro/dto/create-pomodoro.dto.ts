import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PomodoroType } from '../pomodoro.entity';

export class CreatePomodoroDto {
  @IsOptional()
  @IsString()
  @Length(1, 255, { message: 'Title must be between 1 and 255 characters' })
  title?: string;

  @IsOptional()
  @IsString()
  @Length(0, 1000, { message: 'Description must not exceed 1000 characters' })
  description?: string;

  @IsOptional()
  @IsEnum(PomodoroType, { message: 'Invalid pomodoro type' })
  type?: PomodoroType;

  @IsOptional()
  @IsInt({ message: 'Duration must be an integer' })
  @Min(1, { message: 'Duration must be at least 1 minute' })
  @Max(120, { message: 'Duration cannot exceed 120 minutes' })
  @Transform(({ value }) => parseInt(value))
  duration?: number;

  @IsOptional()
  @IsInt({ message: 'Break duration must be an integer' })
  @Min(0, { message: 'Break duration cannot be negative' })
  @Max(30, { message: 'Break duration cannot exceed 30 minutes' })
  @Transform(({ value }) => parseInt(value))
  breakDuration?: number;
}