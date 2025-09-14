import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export enum PomodoroStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum PomodoroType {
  WORK = 'work',
  SHORT_BREAK = 'short_break',
  LONG_BREAK = 'long_break',
}

@Entity('pomodoros')
export class Pomodoro {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: PomodoroType,
    default: PomodoroType.WORK,
  })
  type: PomodoroType;

  @Column({
    type: 'enum',
    enum: PomodoroStatus,
    default: PomodoroStatus.PENDING,
  })
  status: PomodoroStatus;

  @Column({ type: 'int', default: 25 }) // Duration in minutes
  duration: number;

  @Column({ type: 'int', default: 0 }) // Break duration in minutes
  breakDuration: number;

  @Column({ type: 'timestamp', nullable: true })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  pausedAt: Date | null;

  @Column({ type: 'int', default: 0 }) // Total paused time in seconds
  totalPausedTime: number;

  @Column({ type: 'int', default: 0 }) // Actual work time in seconds
  actualWorkTime: number;

  @Column({ type: 'json', nullable: true }) // Store pause intervals
  pauseIntervals: Array<{ startTime: Date; endTime?: Date }>;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper methods
  get isActive(): boolean {
    return this.status === PomodoroStatus.IN_PROGRESS;
  }

  get isPaused(): boolean {
    return this.status === PomodoroStatus.PAUSED;
  }

  get isCompleted(): boolean {
    return this.status === PomodoroStatus.COMPLETED;
  }

  get remainingTime(): number {
    if (!this.startTime || this.status !== PomodoroStatus.IN_PROGRESS) {
      return this.duration * 60; // Convert minutes to seconds
    }

    const now = new Date();
    const elapsed = Math.floor((now.getTime() - this.startTime.getTime()) / 1000);
    const totalDuration = this.duration * 60;
    const remaining = totalDuration - elapsed + this.totalPausedTime;

    return Math.max(0, remaining);
  }
}