import { Module } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { RecordsEntity } from "../entities/records.entity";
import { FileService } from "../files/file.service";
import { UsersService } from "../users/users.service";
import { PublicFileEntity } from "../entities/public-file.entity";
import { UsersEntity } from "../entities/users.entity";
import { AnswersEntity } from "../entities/answers.entity";
import { LikesEntity } from "../entities/llikes.entity";
import { FriendsEntity } from "../entities/friends.entity";
import { ReactionsEntity } from 'src/entities/reaction.entity';
import { MailsService } from '../mail/mail.service';
import { ActionsService } from 'src/actions/actions.service';
import { DevicesEntity } from 'src/entities/device.entity';
import { ReplyAnswersEntity } from 'src/entities/reply-answer.entity';
import { HistoryEntity } from 'src/entities/history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        RecordsEntity,
        PublicFileEntity,
        UsersEntity,
        AnswersEntity,
        ReplyAnswersEntity,
        LikesEntity,
        FriendsEntity,
        ReactionsEntity,
        DevicesEntity,
        HistoryEntity
      ])
  ],
  providers: [RecordsService, FileService, UsersService , MailsService ],
  controllers: [RecordsController],
  exports: [RecordsService],
})
export class RecordsModule {}
