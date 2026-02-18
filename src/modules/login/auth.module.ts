import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LoginService } from './login.service';
import { LoginController } from './login.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Character, CharacterSchema } from '../character/schema/character.schema';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'super_secret_key',
      signOptions: { expiresIn: '2h' },
    }),
    MongooseModule.forFeature([
        { name: Character.name, schema: CharacterSchema  },
    ]),
    
  ],
  controllers: [LoginController],
  providers: [LoginService],
})
export class AuthModule {}
