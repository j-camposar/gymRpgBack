import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Wallet extends Document {

  @Prop({ type: Types.ObjectId, ref: 'Character', required: true })
  characterId: Types.ObjectId;

  @Prop({ default: false })
  coins: number;

}

export const WalletSchema =
  SchemaFactory.createForClass(Wallet);
