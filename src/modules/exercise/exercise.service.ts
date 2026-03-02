import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from './schemas/exercise.schema';
import { TrainingLog } from '../training/schema/training-log.schema';
@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<Exercise>,
    @InjectModel(TrainingLog.name)
    private readonly trainingLogModel: Model<TrainingLog>
  ) {}

    async viewAll(character_id: string) {
        const ultimoLog = await this.trainingLogModel
            .findOne({ characterId: character_id }) 
            .sort({ createdAt: -1 }) // Ordenamos por fecha de creación descendente
            .lean();
        const todos = await this.exerciseModel
            .find()
            .populate('muscles.muscleId')
            .lean();

        return {
            // Devolvemos solo el string del ID para que el front lo compare fácil
            ultimoExerciseId: ultimoLog, 
            todos
        };
    }

}
