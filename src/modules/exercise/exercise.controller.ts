import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { builtinModules } from 'module';
import { ExerciseService } from './exercise.service';

@Controller('exercise')
export class ExerciseController {
  constructor(private readonly exerciseModule: ExerciseService) {}

  @Get("/:character_id")
  async view(@Param("character_id") character_id:string ) {
    return this.exerciseModule.viewAll(character_id);
  }
}