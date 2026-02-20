import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { CharacterService } from './character.service';
import { builtinModules } from 'module';

@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Post()
  async create(@Body() body: { userId: string; name: string ,nick:string,  
    peso:string, edad:number , objetivo:string , coins:number, estatura:string, password:string, email:string, sexo:string}) {
    return this.characterService.create(body.userId, 
         body.name,body.peso,  body.nick, body.edad,body.estatura, body.objetivo, body.coins, body.email, body.password, body.sexo );
  }
  @Get()
  async view() {
    return this.characterService.viewAll();
  }
  @Get(':id')
  async viewById(@Param('id') idUser: string) {
    return this.characterService.viewById(idUser);
  }
  @Get('/muscle/:id')
  async viewMuscleCharacter(@Param('id') idUser: string) {
    return this.characterService.viewMuscleCharacter(idUser)??[];
  }
}