import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { NotificationsEntity } from "../entities/notification.entity";

@Module({
  imports: [TypeOrmModule.forFeature([
    NotificationsEntity
  ])],
  providers: [NotificationsService],
  controllers: [NotificationsController]
})
export class NotificationsModule {}
