import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig: MongooseModuleOptions = {
  // Prioridad total a la variable de entorno de Render
  uri: process.env.MONGODB_URI || 'mongodb+srv://jocamposar:Jcampos2026Arca@gymrpg.lkcrrwt.mongodb.net/?appName=gymRpg',
};