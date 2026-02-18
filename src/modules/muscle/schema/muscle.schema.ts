import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Muscle extends Document {
   @Prop({ required: true, unique: true })
  code: string; // back, chest, legs

  @Prop({ required: true })
  name: string; // Espalda, Pecho

  @Prop({ default: 1 })
  baseDifficulty: number; // balance futuro
}

export const MuscleSchema = SchemaFactory.createForClass(Muscle);
