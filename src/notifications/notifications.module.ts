import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsEntity } from "../entities/notification.entity";
import { AnswersEntity } from 'src/entities/answers.entity';
import { RecordsEntity } from 'src/entities/records.entity';

@Module({
  imports: [TypeOrmModule.forFeature([
    NotificationsEntity,
    AnswersEntity,
    RecordsEntity
  ])],
  providers: [NotificationsService],
  controllers: [NotificationsController],
  exports: [NotificationsService]
})
export class NotificationsModule {}
