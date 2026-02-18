import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TrainingLog extends Document {
  @Prop({ required: true })
  characterId: string;

  @Prop({ required: true })
  exerciseId: string;

  @Prop()
  weight: number;

  @Prop()
  reps: number;

  @Prop()
  quality: number; // 0–1

  @Prop()
  totalXp: number;

  @Prop()
  fatigueGenerated: number;
  
}

export const TrainingLogSchema =
  SchemaFactory.createForClass(TrainingLog);
