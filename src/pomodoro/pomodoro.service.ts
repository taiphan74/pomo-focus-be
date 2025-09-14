import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import {
  Pomodoro,
  PomodoroStatus,
  PomodoroType,
} from './pomodoro.entity';
import { CreatePomodoroDto } from './dto/create-pomodoro.dto';
import { UpdatePomodoroDto } from './dto/update-pomodoro.dto';
import { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { GetPomodorosQueryDto } from './dto/get-pomodoros-query.dto';

export interface PomodoroStats {
  totalPomodoros: number;
  completedPomodoros: number;
  totalWorkTime: number; // in minutes
  averageWorkTime: number; // in minutes
  completionRate: number; // percentage
  todayPomodoros: number;
  weekPomodoros: number;
  monthPomodoros: number;
}

export interface PaginatedPomodoros {
  data: Pomodoro[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class PomodoroService {
  constructor(
    @InjectRepository(Pomodoro)
    private readonly pomodoroRepository: Repository<Pomodoro>,
  ) {}

  async create(
    userId: string,
    createPomodoroDto: CreatePomodoroDto,
  ): Promise<Pomodoro> {
    const pomodoro = this.pomodoroRepository.create({
      ...createPomodoroDto,
      userId,
      type: createPomodoroDto.type || PomodoroType.WORK,
      duration: createPomodoroDto.duration || 25,
      breakDuration: createPomodoroDto.breakDuration || 5,
      pauseIntervals: [],
    });

    return await this.pomodoroRepository.save(pomodoro);
  }

  async findAll(
    userId: string,
    query: GetPomodorosQueryDto,
  ): Promise<PaginatedPomodoros> {
    const {
      status,
      type,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      search,
    } = query;

    const queryBuilder = this.pomodoroRepository
      .createQueryBuilder('pomodoro')
      .where('pomodoro.userId = :userId', { userId })
      .orderBy('pomodoro.createdAt', 'DESC');

    if (status) {
      queryBuilder.andWhere('pomodoro.status = :status', { status });
    }

    if (type) {
      queryBuilder.andWhere('pomodoro.type = :type', { type });
    }

    if (startDate && endDate) {
      queryBuilder.andWhere('pomodoro.createdAt BETWEEN :startDate AND :endDate', {
        startDate,
        endDate,
      });
    }

    if (search) {
      queryBuilder.andWhere(
        '(pomodoro.title ILIKE :search OR pomodoro.description ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async findOne(id: string, userId: string): Promise<Pomodoro> {
    const pomodoro = await this.pomodoroRepository.findOne({
      where: { id, userId },
    });

    if (!pomodoro) {
      throw new NotFoundException('Pomodoro not found');
    }

    return pomodoro;
  }

  async update(
    id: string,
    userId: string,
    updatePomodoroDto: UpdatePomodoroDto,
  ): Promise<Pomodoro> {
    const pomodoro = await this.findOne(id, userId);

    // Prevent updating if pomodoro is in progress
    if (pomodoro.isActive && updatePomodoroDto.status !== PomodoroStatus.PAUSED) {
      throw new BadRequestException(
        'Cannot update pomodoro while it is in progress. Pause it first.',
      );
    }

    Object.assign(pomodoro, updatePomodoroDto);
    return await this.pomodoroRepository.save(pomodoro);
  }

  async start(
    id: string,
    userId: string,
    startPomodoroDto?: StartPomodoroDto,
  ): Promise<Pomodoro> {
    const pomodoro = await this.findOne(id, userId);

    if (pomodoro.isActive) {
      throw new ConflictException('Pomodoro is already in progress');
    }

    if (pomodoro.isCompleted) {
      throw new BadRequestException('Cannot start a completed pomodoro');
    }

    // Check if user has any active pomodoro
    const activePomodoro = await this.pomodoroRepository.findOne({
      where: {
        userId,
        status: PomodoroStatus.IN_PROGRESS,
      },
    });

    if (activePomodoro && activePomodoro.id !== id) {
      throw new ConflictException(
        'You already have an active pomodoro. Please finish or cancel it first.',
      );
    }

    const startTime = startPomodoroDto?.startTime
      ? new Date(startPomodoroDto.startTime)
      : new Date();

    pomodoro.status = PomodoroStatus.IN_PROGRESS;
    pomodoro.startTime = startTime;
    pomodoro.pausedAt = null;

    return await this.pomodoroRepository.save(pomodoro);
  }

  async pause(id: string, userId: string): Promise<Pomodoro> {
    const pomodoro = await this.findOne(id, userId);

    if (!pomodoro.isActive) {
      throw new BadRequestException('Can only pause an active pomodoro');
    }

    const now = new Date();
    pomodoro.status = PomodoroStatus.PAUSED;
    pomodoro.pausedAt = now;

    // Add pause interval
    if (!pomodoro.pauseIntervals) {
      pomodoro.pauseIntervals = [];
    }

    pomodoro.pauseIntervals.push({
      startTime: now,
    });

    return await this.pomodoroRepository.save(pomodoro);
  }

  async resume(id: string, userId: string): Promise<Pomodoro> {
    const pomodoro = await this.findOne(id, userId);

    if (!pomodoro.isPaused) {
      throw new BadRequestException('Can only resume a paused pomodoro');
    }

    const now = new Date();
    pomodoro.status = PomodoroStatus.IN_PROGRESS;

    // Calculate paused time and update total
    if (pomodoro.pausedAt) {
      const pausedDuration = Math.floor(
        (now.getTime() - pomodoro.pausedAt.getTime()) / 1000,
      );
      pomodoro.totalPausedTime += pausedDuration;
    }

    // Update last pause interval
    if (pomodoro.pauseIntervals && pomodoro.pauseIntervals.length > 0) {
      const lastInterval = pomodoro.pauseIntervals[pomodoro.pauseIntervals.length - 1];
      if (!lastInterval.endTime) {
        lastInterval.endTime = now;
      }
    }

    pomodoro.pausedAt = null;

    return await this.pomodoroRepository.save(pomodoro);
  }

  async complete(id: string, userId: string): Promise<Pomodoro> {
    const pomodoro = await this.findOne(id, userId);

    if (pomodoro.isCompleted) {
      throw new BadRequestException('Pomodoro is already completed');
    }

    const now = new Date();
    pomodoro.status = PomodoroStatus.COMPLETED;
    pomodoro.endTime = now;

    // Calculate actual work time
    if (pomodoro.startTime) {
      const totalTime = Math.floor(
        (now.getTime() - pomodoro.startTime.getTime()) / 1000,
      );
      pomodoro.actualWorkTime = totalTime - pomodoro.totalPausedTime;
    }

    return await this.pomodoroRepository.save(pomodoro);
  }

  async cancel(id: string, userId: string): Promise<Pomodoro> {
    const pomodoro = await this.findOne(id, userId);

    if (pomodoro.isCompleted) {
      throw new BadRequestException('Cannot cancel a completed pomodoro');
    }

    pomodoro.status = PomodoroStatus.CANCELLED;
    pomodoro.endTime = new Date();

    return await this.pomodoroRepository.save(pomodoro);
  }

  async delete(id: string, userId: string): Promise<void> {
    const pomodoro = await this.findOne(id, userId);

    if (pomodoro.isActive) {
      throw new BadRequestException('Cannot delete an active pomodoro. Cancel it first.');
    }

    await this.pomodoroRepository.remove(pomodoro);
  }

  async getStats(userId: string): Promise<PomodoroStats> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalPomodoros,
      completedPomodoros,
      todayPomodoros,
      weekPomodoros,
      monthPomodoros,
    ] = await Promise.all([
      this.pomodoroRepository.count({ where: { userId } }),
      this.pomodoroRepository.count({
        where: { userId, status: PomodoroStatus.COMPLETED },
      }),
      this.pomodoroRepository.count({
        where: {
          userId,
          createdAt: Between(todayStart, now),
        },
      }),
      this.pomodoroRepository.count({
        where: {
          userId,
          createdAt: Between(weekStart, now),
        },
      }),
      this.pomodoroRepository.count({
        where: {
          userId,
          createdAt: Between(monthStart, now),
        },
      }),
    ]);

    const completedPomodorosData = await this.pomodoroRepository.find({
      where: { userId, status: PomodoroStatus.COMPLETED },
      select: ['actualWorkTime'],
    });

    const totalWorkTime = completedPomodorosData.reduce(
      (sum, pomodoro) => sum + (pomodoro.actualWorkTime || 0),
      0,
    );

    const averageWorkTime = completedPomodoros > 0
      ? totalWorkTime / completedPomodoros / 60 // Convert to minutes
      : 0;

    const completionRate = totalPomodoros > 0
      ? (completedPomodoros / totalPomodoros) * 100
      : 0;

    return {
      totalPomodoros,
      completedPomodoros,
      totalWorkTime: Math.floor(totalWorkTime / 60), // Convert to minutes
      averageWorkTime: Math.floor(averageWorkTime),
      completionRate: Math.round(completionRate * 100) / 100,
      todayPomodoros,
      weekPomodoros,
      monthPomodoros,
    };
  }

  async getCurrentActive(userId: string): Promise<Pomodoro | null> {
    return await this.pomodoroRepository.findOne({
      where: {
        userId,
        status: PomodoroStatus.IN_PROGRESS,
      },
    });
  }
}