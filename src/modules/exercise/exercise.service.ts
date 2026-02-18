import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Exercise } from './schemas/exercise.schema';
@Injectable()
export class ExerciseService {
  constructor(
    @InjectModel(Exercise.name)
    private readonly exerciseModel: Model<Exercise>,

  ) {}
    async viewAll() {
        return this.exerciseModel
             .find()
        .populate('muscles.muscleId')
        .lean();
    }

}
