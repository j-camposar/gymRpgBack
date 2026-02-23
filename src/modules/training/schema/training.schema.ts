import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Character } from 'src/modules/character/schema/character.schema';

@Schema({ timestamps: true })
export class Training extends Document {
  @Prop({ type:String, ref: 'Character' })
  characterId: Character;

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
