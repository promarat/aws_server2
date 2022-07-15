import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailsService } from './mail.service'
import { AuthService } from 'src/auth/auth.service';
import { UsersService } from "../users/users.service";
import { RecordsService } from '../records/records.service';
import { ConfigService } from 'nestjs-config';
import { join } from 'path';
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { RefreshTokenEntity } from "../entities/token.entity";
import { PasswordResetEntity } from "../entities/reset-password.entity";
import { PublicFileEntity } from "../entities/public-file.entity";
import { SubScribeEntity } from "../entities/subscribe.entity";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { LikesEntity } from "src/entities/llikes.entity";
import { ReactionsEntity } from "src/entities/reaction.entity";
import { FriendsEntity } from "src/entities/friends.entity";
import { TokenService } from 'src/auth/token/token.service';
import { FileService } from 'src/files/file.service';
import { DevicesEntity } from 'src/entities/device.entity';
import { AuthModule } from 'src/auth/auth.module';
import { TasksService } from 'src/notice';
import { AdminService } from '../admin/admin.service';
import { AdminEntity } from '../entities/admin.entity';
import { ReplyAnswersEntity } from 'src/entities/reply-answer.entity';
import { HistoryEntity } from 'src/entities/history.entity';

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        transport:
            {
              // pool: true,
              host: configService.get('app.smtp_host'),
              // port: configService.get('app.smtp_port'),
              // ignoreTLS: configService.get('app.smtp_tls'),
              // secure: configService.get('app.smtp_secure'),
              auth: {
                user: configService.get('app.smtp_user'),
                pass: configService.get('app.smtp_pass'),
              },
              tls: {
                rejectUnauthorized: true,
              },
            },
        template: {
          dir: join(__dirname, 'template'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature(
      [
        UsersEntity,
        RefreshTokenEntity,
        PasswordResetEntity,
        PublicFileEntity,
        SubScribeEntity,
        RecordsEntity,
        AnswersEntity,
        ReplyAnswersEntity,
        LikesEntity,
        ReactionsEntity,
        FriendsEntity,
        DevicesEntity,
        AdminEntity,
        HistoryEntity
      ]),
  ],
  providers: [
    MailsService,
    UsersService,
    RecordsService,
    FileService,
    TokenService,
    TasksService,
    AdminService
  ],
  exports: [MailsService],
})
export class MailModule {}
