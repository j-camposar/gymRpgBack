import { Controller, Post, Body, Get } from '@nestjs/common';
import { builtinModules } from 'module';
import { ExerciseService } from './exercise.service';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseModule: ExerciseService) {}

  @Get()
  async view() {
    return this.exerciseModule.viewAll();
  }
}