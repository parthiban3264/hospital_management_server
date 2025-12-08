import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '12mb' }));
  app.use(bodyParser.urlencoded({ limit: '12mb', extended: true }));
  await app.listen(3007);
}
bootstrap();
