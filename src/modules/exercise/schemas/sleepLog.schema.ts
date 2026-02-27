import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class SleepLog extends Document {
  @Prop({ required: true })
  hours: number;

  @Prop({ default: 5 }) // Calidad del 1 al 10
  quality: number;

  @Prop({ type: Types.ObjectId, ref: 'Character' })
  characterId: Types.ObjectId;
}
export const SleepLogSchema =
  SchemaFactory.createForClass(SleepLog);