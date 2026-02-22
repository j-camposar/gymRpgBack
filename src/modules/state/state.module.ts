import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { StateService } from './state.service';
import { StateController } from './state.controller';
import { CharacterMuscle, CharacterMuscleSchema } from '../character/schema/characterMuscle.schema';
import { ProgressionService } from '../progression/progression.service';
import { Character, CharacterSchema } from '../character/schema/character.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CharacterMuscle.name, schema: CharacterMuscleSchema },
      { name: Character.name, schema: CharacterSchema },
    ]),
  ],
  providers: [StateService, ProgressionService],
  controllers: [StateController],
  exports: [StateService],
})
export class StateModule {}
