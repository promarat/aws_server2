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
import { MailsService } from '../mail/mail.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { UsersService } from 'src/users/users.service';
import { DevicesEntity } from 'src/entities/device.entity';
import { ReplyAnswersEntity } from 'src/entities/reply-answer.entity';
import { TagsEntity } from 'src/entities/tag.entity';
import { HistoryEntity } from 'src/entities/history.entity';
import { MessagesEntity } from 'src/entities/message.entity';
import { ConversationsEntity } from 'src/entities/conversations.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        AnswersEntity,
        ReplyAnswersEntity,
        LikesEntity,
        ReactionsEntity,
        RecordsEntity,
        PublicFileEntity,
        UsersEntity,
        FriendsEntity,
        CountryEntity,
        ReportsEntity,
        DevicesEntity,
        TagsEntity,
        HistoryEntity,
        MessagesEntity,
        ConversationsEntity
      ]),
      NotificationsModule
  ],
  providers: [ActionsService, FileService , UsersService, MailsService, RecordsService],
  controllers: [ActionsController]
})
export class ActionsModule {}
