import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MisionService } from './mision.service';
import { Mision, MisionSchema } from './schema/mision.schema';
import { CharacterMision, CharacterMisionSchema } from '../character/schema/characterMision.schema';
import { Wallet, WalletSchema } from '../economy/schema/wallet.schema';
import { MisionController } from './mision.controller';
import { Character, CharacterSchema } from '../character/schema/character.schema';


@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Mision.name, schema: MisionSchema },
      { name: CharacterMision.name, schema: CharacterMisionSchema  },
      { name: Character.name, schema: CharacterSchema  },
      { name: Wallet.name, schema: WalletSchema },
    ]),
  ],
  providers: [MisionService],
  controllers: [MisionController],   
  exports: [MisionService], // importante para otros módulos (muscle, training)
})
export class MisionModule {}
