import { Module } from "@nestjs/common";
import { AccountService } from "./account.service";
import { AccountController } from "./account.controller";
import { UsersService } from "../users/users.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { FileService } from "../files/file.service";
import { PublicFileEntity } from "../entities/public-file.entity";
import { RecordsService } from "../records/records.service";
import { RecordsEntity } from "../entities/records.entity";
import { AnswersEntity } from "../entities/answers.entity";
import { LikesEntity } from "../entities/llikes.entity";
import { FriendsEntity } from "../entities/friends.entity";
import { MailsService } from "src/mail/mail.service";
import { ReactionsEntity } from "src/entities/reaction.entity";
import { DevicesEntity } from "src/entities/device.entity";
import { ReplyAnswersEntity } from "src/entities/reply-answer.entity";
import { HistoryEntity } from "src/entities/history.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        UsersEntity,
        PublicFileEntity,
        RecordsEntity,
        AnswersEntity,
        ReplyAnswersEntity,
        LikesEntity,
        FriendsEntity,
        ReactionsEntity,
        DevicesEntity,
        HistoryEntity
      ])
  ],
  providers: [
    AccountService,
    UsersService,
    FileService,
    RecordsService,
    MailsService
  ],
  controllers: [AccountController]
})
export class AccountModule {
}
