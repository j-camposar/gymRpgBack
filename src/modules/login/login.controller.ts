import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { LoginService } from './login.service';

@Controller('auth')
export class LoginController {
    constructor(private readonly loginService: LoginService) {}
     
    @Post('/login')
    async login( @Body()  data:{ email:string , password:string } ) {
        console.log("login");
        return this.loginService.auth(data);
    }
    @Get('/login')
    async getLogin(){
        return "hola mundo";
    }

}