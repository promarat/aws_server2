import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailService } from './mail.service';
import { ConfigService } from 'nestjs-config';

@Module({
  imports: [

    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport:
            {
              pool: true,
              host: configService.get('app.smtp_host'),
              port: configService.get('app.smtp_port'),
              ignoreTLS: configService.get('app.smtp_tls'),
              secure: configService.get('app.smtp_secure'),
              auth: {
                user: configService.get('app.smtp_user'),
                pass: configService.get('app.smtp_pass'),
              },
              tls: {
                rejectUnauthorized: true,
              },
            },
        template: {
          dir: __dirname + '/template',
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    })],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
