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

@Entity({ name: "replyAnswers" })
export class ReplyAnswersEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true, default: 0 })
  likesCount: number;

  @Column({ nullable: true , default: 0})
  listenCount: number

  @Column({ nullable: true , default: 0})
  shareCount: number

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @JoinColumn()
  @OneToOne(type => PublicFileEntity, file => file.replyAnswer) //todo remove from bucket
  file: PublicFileEntity;

  @ManyToOne(type => UsersEntity, user => user.replyAnswers, { onDelete: "CASCADE", cascade: true })
  user: UsersEntity;

  @ManyToOne(type => AnswersEntity, answer => answer.replyAnswers, { onDelete: "CASCADE", cascade: true }) //todo remove with record?
  answer: AnswersEntity;

  @OneToMany(type => LikesEntity, likes => likes.replyAnswer) //todo remove with record?
  likes: LikesEntity[];

  @OneToMany(type => TagsEntity, tags => tags.replyAnswer) //todo remove with record?
  tags: TagsEntity[];

  @OneToMany(type => ReportsEntity, reports => reports.answer)
  reports: ReportsEntity[];

  @AfterLoad()
  domainUrl() {
    if (this.file) {
      this.file.link = `${ConfigService.get('app.domain')}/files/${this.file.link}`;
    }
  }
}
