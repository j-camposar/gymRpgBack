import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { TrainingController } from './training.controller';
import { Exercise, ExerciseSchema } from '../exercise/schemas/exercise.schema';
import { CharacterMuscle, CharacterMuscleSchema } from '../character/schema/characterMuscle.schema';
import { TrainingLog, TrainingLogSchema } from './schema/trainin-log.schema';
import { TrainingService } from './training.service';
import { ProgressionService } from '../progression/progression.service';
import { Muscle, MuscleSchema } from '../muscle/schema/muscle.schema';
import { MisionService } from '../mission/mision.service';
import { Mision, MisionSchema } from '../mission/schema/mision.schema';
import { MisionModule } from '../mission/mision.module';
import { Character, CharacterSchema } from '../character/schema/character.schema';
import { CharacterExerciseStats, CharacterExerciseStatsSchema } from '../character/schema/characterExerciseStats.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exercise.name, schema: ExerciseSchema },
      {name: CharacterMuscle.name, schema: CharacterMuscleSchema },
      {name: Character.name, schema: CharacterSchema },
      {name: CharacterExerciseStats.name, schema: CharacterExerciseStatsSchema },
      { name: TrainingLog.name, schema: TrainingLogSchema },
      { name: Muscle.name, schema: MuscleSchema },
    ]),
    MisionModule
  ],
  providers: [TrainingService, ProgressionService],
  controllers: [TrainingController],
})
export class TrainingModule {}