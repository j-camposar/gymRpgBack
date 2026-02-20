import { MongooseModuleOptions } from '@nestjs/mongoose';

export const databaseConfig: MongooseModuleOptions = {
  uri: process.env.MONGO_URI || 'mongodb+srv://jocamposar:jocamposar@gymrpg.lkcrrwt.mongodb.net/?appName=gymRpg',
};