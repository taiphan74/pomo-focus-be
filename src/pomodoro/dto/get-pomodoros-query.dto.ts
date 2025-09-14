import {
  IsOptional,
  IsString,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PomodoroStatus, PomodoroType } from '../pomodoro.entity';

export class GetPomodorosQueryDto {
  @IsOptional()
  @IsEnum(PomodoroStatus, { message: 'Invalid pomodoro status' })
  status?: PomodoroStatus;

  @IsOptional()
  @IsEnum(PomodoroType, { message: 'Invalid pomodoro type' })
  type?: PomodoroType;

  @IsOptional()
  @IsDateString({}, { message: 'Start date must be a valid ISO date string' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'End date must be a valid ISO date string' })
  endDate?: string;

  @IsOptional()
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  @Transform(({ value }) => parseInt(value))
  page?: number = 1;

  @IsOptional()
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  @Transform(({ value }) => parseInt(value))
  limit?: number = 10;

  @IsOptional()
  @IsString()
  search?: string;
}