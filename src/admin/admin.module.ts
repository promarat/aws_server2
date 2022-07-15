import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { AdminEntity } from "../entities/admin.entity";
import { RefreshTokenEntity } from "../entities/token.entity";
import { PublicFileEntity } from "../entities/public-file.entity";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { DevicesEntity } from 'src/entities/device.entity';

@Module({
  imports: [
  TypeOrmModule.forFeature(
      [
        AdminEntity,
        RefreshTokenEntity,
        PublicFileEntity,
        RecordsEntity,
        AnswersEntity,
        DevicesEntity
      ])
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService]
})
export class AdminModule {}
