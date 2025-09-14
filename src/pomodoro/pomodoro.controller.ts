import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
  ParseUUIDPipe,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PomodoroService, PomodoroStats, PaginatedPomodoros } from './pomodoro.service';
import { Pomodoro } from './pomodoro.entity';
import { CreatePomodoroDto } from './dto/create-pomodoro.dto';
import { UpdatePomodoroDto } from './dto/update-pomodoro.dto';
import { StartPomodoroDto } from './dto/start-pomodoro.dto';
import { GetPomodorosQueryDto } from './dto/get-pomodoros-query.dto';

@Controller('pomodoros')
@UseGuards(JwtAuthGuard)
export class PomodoroController {
  constructor(private readonly pomodoroService: PomodoroService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Request() req: any,
    @Body() createPomodoroDto: CreatePomodoroDto,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.create(req.user.id, createPomodoroDto);
  }

  @Get()
  async findAll(
    @Request() req: any,
    @Query() query: GetPomodorosQueryDto,
  ): Promise<PaginatedPomodoros> {
    return await this.pomodoroService.findAll(req.user.id, query);
  }

  @Get('stats')
  async getStats(@Request() req: any): Promise<PomodoroStats> {
    return await this.pomodoroService.getStats(req.user.id);
  }

  @Get('active')
  async getCurrentActive(@Request() req: any): Promise<Pomodoro | null> {
    return await this.pomodoroService.getCurrentActive(req.user.id);
  }

  @Get(':id')
  async findOne(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePomodoroDto: UpdatePomodoroDto,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.update(id, req.user.id, updatePomodoroDto);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  async start(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() startPomodoroDto?: StartPomodoroDto,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.start(id, req.user.id, startPomodoroDto);
  }

  @Post(':id/pause')
  @HttpCode(HttpStatus.OK)
  async pause(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.pause(id, req.user.id);
  }

  @Post(':id/resume')
  @HttpCode(HttpStatus.OK)
  async resume(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.resume(id, req.user.id);
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.complete(id, req.user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<Pomodoro> {
    return await this.pomodoroService.cancel(id, req.user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(
    @Request() req: any,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    await this.pomodoroService.delete(id, req.user.id);
  }
}