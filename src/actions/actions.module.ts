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

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        AnswersEntity,
        LikesEntity,
        RecordsEntity,
        PublicFileEntity,
        UsersEntity,
        FriendsEntity,
        CountryEntity,
      ]),
      NotificationsModule
  ],
  providers: [ActionsService, FileService],
  controllers: [ActionsController]
})
export class ActionsModule {}
