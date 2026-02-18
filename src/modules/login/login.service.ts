import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { InjectModel } from '@nestjs/mongoose';
import { Character } from '../character/schema/character.schema';
import { Model } from 'mongoose';

@Injectable()
export class LoginService {
    
  constructor(private jwtService: JwtService,
        @InjectModel(Character.name)
        private readonly characterModel: Model<Character>,
  ) {}

  async auth(data: { email: string; password: string }) {
    console.log(data);
    const character= await this.characterModel.findOne({"email":data.email })
    if (!character) {
      throw new UnauthorizedException('Usuario no encontrado');
    }
     const isValid = bcrypt.compareSync(data.password, character.password);

    if (!isValid) {
      throw new UnauthorizedException('Password incorrecto');
    }

    const payload = { sub: character._id, email: character.email };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id:character._id,
        email: data.email
      }
     
    };
  }
}


