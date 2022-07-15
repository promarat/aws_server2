import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { UsersEntity } from "./users.entity";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";
import { ReplyAnswersEntity } from "./reply-answer.entity";
import { StoryTypeEnum, tagUser } from "src/lib/enum";
import { LikesEntity } from "./llikes.entity";

@Entity({ name: "tags" })
export class TagsEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: StoryTypeEnum })
  type: StoryTypeEnum;

  @Column({ nullable: true, default: 0 })
  likesCount: number;

  @ManyToOne(() => UsersEntity, (user) => user.tags, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  user: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.tags, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  record: RecordsEntity;

  @ManyToOne(() => AnswersEntity, (answer) => answer.tags, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  answer: AnswersEntity;

  @ManyToOne(() => ReplyAnswersEntity, (replyAnswer) => replyAnswer.tags, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  replyAnswer: ReplyAnswersEntity;

  @Column('text',{ nullable: true, array: true })
  userIds: string[];
  
  @OneToMany(type => LikesEntity, likes => likes.tagFriend) //todo remove with record?
  likes: LikesEntity[];

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date; 
}
