import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { RefreshTokenEntity } from "../entities/token.entity";
import { PublicFileEntity } from "../entities/public-file.entity";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { DevicesEntity } from 'src/entities/device.entity';
import { HistoryEntity } from 'src/entities/history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        UsersEntity,
        RefreshTokenEntity,
        PublicFileEntity,
        RecordsEntity,
        AnswersEntity,
        DevicesEntity,
        HistoryEntity
      ])
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService]
})
export class UsersModule {}
