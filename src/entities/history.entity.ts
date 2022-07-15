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
import { AnswersEntity } from "./answers.entity";
import { LikesEntity } from "./llikes.entity";
import { NotificationsEntity } from "./notification.entity";
import { ConfigService } from "nestjs-config";
import { ReportsEntity } from "./reports.entity";
import { ReactionsEntity } from "./reaction.entity";
import { TagsEntity } from "./tag.entity";
import { StoryTypeEnum } from "src/lib/enum";

export enum HistoryTypeEnum {
  LISTEN_STORY = "listenStory",
  OPEN_APP = "openApp",
  SESSION = "session",
  SHARE_LINK = "shareLink",
  SHARE_STORY = "shareStory"
}

@Entity({ name: "history" })
export class HistoryEntity {
  
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: HistoryTypeEnum })
  type: HistoryTypeEnum;

  @Column({ type: "enum", enum: StoryTypeEnum, nullable: true })
  storyType: StoryTypeEnum;

  @ManyToOne(type => UsersEntity, user => user.history, { onDelete: "CASCADE", cascade: true })
  user: UsersEntity;

  @Column({ nullable: true , default: 0})
  value : number

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;
}
