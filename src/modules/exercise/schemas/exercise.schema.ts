import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Muscle } from 'src/modules/muscle/schema/muscle.schema';
@Schema({ timestamps: true })
export class Exercise extends Document {
    @Prop({ required: true })
    name: string; // Press banca, Sentadilla

    @Prop({
        type: [
        {
            muscleId: { type: Types.ObjectId, ref: 'Muscle', required: true },
            multiplier: { type: Number, required: true },
        },
        ],
        required: true,
    })
    muscles: {
        muscleId: Types.ObjectId;
        multiplier: number;
    }[];    
}
export const ExerciseSchema =
  SchemaFactory.createForClass(Exercise);
