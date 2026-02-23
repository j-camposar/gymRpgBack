import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Muscle } from 'src/modules/muscle/schema/muscle.schema';
import { Character } from './character.schema';
import mongoose from 'mongoose';


@Schema({ timestamps: true })
export class CharacterExerciseStats {
   @Prop({ type: String, ref: 'Character' })
    userId: Character;

    @Prop()
    bodyFatPercentage: number;

    @Prop()
    muscleMassPercentage: number;

    @Prop()
    estimatedWeight: number;

    @Prop({ default: Date.now })
    createdAt: Date;

}
export const CharacterExerciseStatsSchema = SchemaFactory.createForClass(CharacterExerciseStats);
