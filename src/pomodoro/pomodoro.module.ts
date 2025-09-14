import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pomodoro } from './pomodoro.entity';
import { PomodoroController } from './pomodoro.controller';
import { PomodoroService } from './pomodoro.service';

@Module({
  imports: [TypeOrmModule.forFeature([Pomodoro])],
  controllers: [PomodoroController],
  providers: [PomodoroService],
  exports: [PomodoroService],
})
export class PomodoroModule {}