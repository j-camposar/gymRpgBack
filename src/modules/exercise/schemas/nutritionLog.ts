import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Idea de esquema rápido para la V4
@Schema({ timestamps: true })
export class NutritionLog extends Document {
  @Prop({ required: true })
  foodName: string;
  @Prop()
  protein: number;
  @Prop()
  carbs: number;
  @Prop()
  fat: number;
  @Prop()
  fibra: number;
  @Prop()
  azucar: number;
  @Prop()
  sodio: number;
  @Prop()
  calories: number;
  @Prop({ type: Types.ObjectId, ref: 'Character' })
  characterId: Types.ObjectId;
}
export const NutritionLogSchema =
  SchemaFactory.createForClass(NutritionLog);
