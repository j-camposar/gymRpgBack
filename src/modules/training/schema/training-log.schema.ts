import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
// No olvides importar el esquema de Training si necesitas tipado fuerte
import { Training } from './training.schema';

@Schema({ timestamps: true })
export class TrainingLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
  characterId: string;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true })
  exerciseId: string;
  
  // CORRECCIÓN: Usamos Types.ObjectId para que MongoDB reconozca el vínculo
  @Prop({ type: Types.ObjectId, ref: 'Training', required: true })
  trainingId: Types.ObjectId; 

  @Prop({ required: true })
  weight: number;

  @Prop({ required: true })
  reps: number;

  @Prop({ default: 1 })
  quality: number; // 0–1

  @Prop({ default: 0 })
  totalXp: number;

  @Prop({ default: 0 })
  fatigueGenerated: number;
}

export const TrainingLogSchema = SchemaFactory.createForClass(TrainingLog);