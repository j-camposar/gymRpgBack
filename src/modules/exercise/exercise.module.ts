import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ExerciseService } from './exercise.service';
import { Exercise, ExerciseSchema } from './schemas/exercise.schema';
import { ExerciseController } from './exercise.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Exercise.name, schema: ExerciseSchema },
    ]),
  ],
  providers: [ExerciseService],
  controllers: [ExerciseController],
  exports: [ExerciseService], // importante para otros módulos (muscle, training)
})
export class ExerciseModule {}
