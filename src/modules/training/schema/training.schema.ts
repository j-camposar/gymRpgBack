import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ 
  timestamps: true,
  toJSON: { virtuals: true }, // Importante para que aparezcan en el JSON
  toObject: { virtuals: true }
})
export class Training extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Character' })
  characterId: Types.ObjectId;

  @Prop()
  startTime: Date;

   @Prop()
  status: string;

  @Prop()
  endTime: Date;

  @Prop()
  fatigaGenerada: number;
  
}

export const TrainingSchema =
  SchemaFactory.createForClass(Training);
