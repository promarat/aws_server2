import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";
import { FileTypeEnum } from "../lib/enum";
import { UsersEntity } from "./users.entity";
import { ReplyAnswersEntity } from "./reply-answer.entity";
import { MessagesEntity } from "./message.entity";

@Entity({ name: "s3_files" })
export class PublicFileEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: FileTypeEnum,
  })
  type: FileTypeEnum;

  @Column({ default: null })
  link: string;

  @Column()
  public key: string;

  @OneToOne(type => RecordsEntity, record => record.file)
  record: RecordsEntity;

  @OneToOne(type => AnswersEntity, answer => answer.file)
  answer: AnswersEntity;

  @OneToOne(type => ReplyAnswersEntity, replyAnswer => replyAnswer.file)
  replyAnswer: ReplyAnswersEntity;

  @OneToOne(type => MessagesEntity, message => message.file)
  message: MessagesEntity;

  @OneToOne(type => UsersEntity, user => user.avatar)
  user: UsersEntity;

}
