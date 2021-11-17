import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "nestjs-config";
import { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as bodyParser from 'body-parser';
import { config } from 'aws-sdk';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { cors: true });
  const configService = app.get<any>(ConfigService);
  const host = configService.get('app.host')
  const port = configService.get('app.port')
  const prefix = configService.get('app.backend_api_prefix')
  if (prefix) {
    app.setGlobalPrefix(prefix);
  }
  const options = new DocumentBuilder()
    .addBearerAuth()
    .setTitle('Social voice app backend API')
    .setDescription('endpoints')
    .setVersion('1.0')
    .build();
  config.update({
    accessKeyId: configService.get('app.aws_access_key_id'),
    secretAccessKey: configService.get('app.aws_secret_access_key'),
    region: configService.get('app.aws_region'),
  });
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('documentation', app, document);
  app.enableCors();
  app.use(bodyParser.text({limit: '10mb'}));
  app.use(bodyParser.urlencoded({limit: '10mb', extended: true}));
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  Logger.log(`Listening at http://${host}:${port}/documentation`)
  await app.listen(port, host);
}
bootstrap().then(() => Logger.log(`${new Date()}`));
