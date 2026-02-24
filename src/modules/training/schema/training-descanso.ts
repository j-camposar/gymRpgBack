import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class TrainingDescanso extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
  characterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Training', required: true })
  trainingId: Types.ObjectId; 

  @Prop({ required: true })
  segundos: number;

  @Prop({ required: true })
  fatigaReducida: number;

}

export const TrainingDescansoSchema = SchemaFactory.createForClass(TrainingDescanso);