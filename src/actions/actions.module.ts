import { Module } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { ActionsController } from './actions.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { AnswersEntity } from "../entities/answers.entity";
import { LikesEntity } from "../entities/llikes.entity";
import { RecordsEntity } from "../entities/records.entity";
import { FileService } from "../files/file.service";
import { PublicFileEntity } from "../entities/public-file.entity";
import { UsersEntity } from "../entities/users.entity";
import { FriendsEntity } from "../entities/friends.entity";
import { CountryEntity } from "../entities/countries.entity";
import { RecordsService } from "../records/records.service";
import { NotificationsService } from 'src/notifications/notifications.service';
import { NotificationsEntity } from '../entities/notification.entity';
import { NotificationsModule } from 'src/notifications/notifications.module';
import { ReportsEntity } from 'src/entities/reports.entity';
import { ReactionsEntity } from 'src/entities/reaction.entity';
import { MailService } from '../mail/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        AnswersEntity,
        LikesEntity,
        ReactionsEntity,
        RecordsEntity,
        PublicFileEntity,
        UsersEntity,
        FriendsEntity,
        CountryEntity,
        ReportsEntity
      ]),
      NotificationsModule
  ],
  providers: [ActionsService, FileService , UsersService, RecordsService, MailService],
  controllers: [ActionsController]
})
export class ActionsModule {}
