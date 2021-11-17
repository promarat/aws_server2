import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { TypeOrmModule } from "@nestjs/typeorm";
import { FriendsEntity } from "../entities/friends.entity";

@Module({
  imports: [TypeOrmModule.forFeature([
    FriendsEntity
  ])],
  providers: [FriendsService],
  controllers: [FriendsController]
})
export class FriendsModule {}
