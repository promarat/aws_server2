import {
  AfterLoad,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn
} from "typeorm";
import { PublicFileEntity } from "./public-file.entity";
import { UsersEntity } from "./users.entity";
import { LikesEntity } from "./llikes.entity";
import { ConfigService } from "nestjs-config";
import { ReportsEntity } from "./reports.entity";
import { AnswersEntity } from "./answers.entity";
import { TagsEntity } from "./tag.entity";
import { RecordsEntity } from "./records.entity";

export enum MessageTypeEnum {
  VOICE = "voice",
  PHOTO = "photo",
  EMOJI = "emoji",
  RECORD = "record"
}

@Entity({ name: "messages" })
export class MessagesEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: MessageTypeEnum })
  type: MessageTypeEnum;

  @Column({ nullable: true })
  duration: string;

  @Column({ type: "boolean", default: false })
  seen: boolean;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: true })
  ancestorId: string;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @JoinColumn()

  @OneToOne(type => PublicFileEntity, file => file.message) //todo remove from bucket
  file: PublicFileEntity;

  @ManyToOne(type => UsersEntity, user => user.sentMessages, { onDelete: "CASCADE", cascade: true })
  user: UsersEntity;

  @ManyToOne(type => UsersEntity, toUser => toUser.receivedMessages, { onDelete: "CASCADE", cascade: true })
  toUser: UsersEntity;

  @ManyToOne(type => RecordsEntity, record => record.messages, { onDelete: "CASCADE", cascade: true, nullable:true })
  record: RecordsEntity;


  @AfterLoad()
  domainUrl() {
    if (this.file) {
      this.file.link = `${ConfigService.get('app.domain')}/files/${this.file.link}`;
    }
  }
}
