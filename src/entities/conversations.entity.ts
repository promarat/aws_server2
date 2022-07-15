import {
  AfterLoad,
  Column,
  UpdateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  CreateDateColumn
} from "typeorm";
import { PublicFileEntity } from "./public-file.entity";
import { UsersEntity } from "./users.entity";
import { LikesEntity } from "./llikes.entity";
import { ConfigService } from "nestjs-config";
import { ReportsEntity } from "./reports.entity";
import { AnswersEntity } from "./answers.entity";
import { TagsEntity } from "./tag.entity";

export enum ChatTypeEnum {
  VOICE = "voice",
  PHOTO = "photo",
  EMOJI = "emoji",
  RECORD = "record",
}

@Entity({ name: "conversations" })
export class ConversationsEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: ChatTypeEnum, default: ChatTypeEnum.VOICE })
  type: ChatTypeEnum;

  @Column({ nullable: true , default: 1})
  newsCount: number;

  @Column({ nullable: true })
  emoji: string;

  @ManyToOne(type => UsersEntity, sender => sender.firstConversation, { onDelete: "CASCADE", cascade: true })
  sender: UsersEntity;

  @ManyToOne(type => UsersEntity, receiver => receiver.secondConversation, { onDelete: "CASCADE", cascade: true })
  receiver: UsersEntity;

  @UpdateDateColumn({
    type: "timestamp without time zone",
    name: "updatedAt"
  })
  updatedAt: Date;

}
