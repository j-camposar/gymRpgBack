import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Configuración de CORS
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://192.168.1.132:3000', 
      'https://gym-rpg-front-fh6r.vercel.app' // Tu URL de Vercel
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Render asigna el puerto mediante la variable PORT
  const port = process.env.PORT || 3001;

  // Escuchar en '0.0.0.0' es fundamental para Docker/Render/Railway
  await app.listen(port, '0.0.0.0');
  
  logger.log(`El Arca está navegando en el puerto: ${port}`);
}
bootstrap();