import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TrainingLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
  characterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Exercise', required: true })
  exerciseId: Types.ObjectId;
  
  // CORRECCIÓN: Usamos Types.ObjectId para que MongoDB reconozca el vínculo
  @Prop({ type: Types.ObjectId, ref: 'Training', required: true })
  trainingId: Types.ObjectId; 

  @Prop({ required: true })
  weight: number;

  @Prop({ required: true })
  reps: number;

  @Prop({ default: 1 })
  quality: number; // 0–1

  @Prop({ default: 1 })
  difficulty: number; // 0–1
  
  @Prop({ default: 0 })
  totalXp: number;

  @Prop({ default: 0 })
  fatigueGenerated: number;
  
  @Prop({ default: 0 })
  caloriesBurned: number;
}

export const TrainingLogSchema = SchemaFactory.createForClass(TrainingLog);