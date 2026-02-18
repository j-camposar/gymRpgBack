import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CharacterService } from './character.service';
import { CharacterController } from './character.controller';
import { Muscle, MuscleSchema } from '../muscle/schema/muscle.schema';
import { CharacterMuscle,CharacterMuscleSchema } from './schema/characterMuscle.schema';
import { Character, CharacterSchema } from './schema/character.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Character.name, schema: CharacterSchema },
      { name: Muscle.name, schema: MuscleSchema },
      { name: CharacterMuscle.name, schema: CharacterMuscleSchema },
    ]),
  ],
  providers: [CharacterService],
  controllers: [CharacterController],
  exports: [CharacterService], // importante para otros módulos (muscle, training)
})
export class CharacterModule {}
