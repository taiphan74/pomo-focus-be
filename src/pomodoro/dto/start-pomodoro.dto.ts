import { IsOptional, IsDateString } from 'class-validator';

export class StartPomodoroDto {
  @IsOptional()
  @IsDateString({}, { message: 'Start time must be a valid ISO date string' })
  startTime?: string;
}