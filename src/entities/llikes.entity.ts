import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UsersEntity } from "./users.entity";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";
import { ReplyAnswersEntity } from "./reply-answer.entity";
import { TagsEntity } from "./tag.entity";

export enum LikeTypeEnum {
  RECORD = "record",
  ANSWER = "answer",
  REPLY_ANSWER = "replyAnswer",
  TAG_FRIEND = "tagFriend"
}

@Entity({ name: "likes" })
export class LikesEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: LikeTypeEnum })
  type: LikeTypeEnum;

  @Column({default: null})
  emoji: string;

  @Column({default: true})
  isLike: boolean;

  @ManyToOne(() => UsersEntity, (user) => user.likes, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  user: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.likes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  record: RecordsEntity;

  @ManyToOne(() => AnswersEntity, (answer) => answer.likes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  answer: AnswersEntity;

  @ManyToOne(() => ReplyAnswersEntity, (replyAnswer) => replyAnswer.likes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  replyAnswer: ReplyAnswersEntity;

  @ManyToOne(() => TagsEntity, (tagFriend) => tagFriend.likes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  tagFriend: TagsEntity;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date; 
}
