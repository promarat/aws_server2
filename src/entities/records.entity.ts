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


@Entity({ name: "records" })
export class RecordsEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  title: string;

  @Column({ nullable: true })
  emoji: string;

  @Column({ nullable: false })
  category: string;

  @Column({ nullable: true, default: 0 })
  duration: string;

  @Column({ type: "boolean", default: false })
  privacy: boolean;

  @Column({ nullable: true , default: 0})
  likesCount: number

  @Column({ nullable: true , default: 0})
  reactionsCount: number

  @Column({ nullable: true })
  colorType: number

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @JoinColumn()
  @OneToOne(type => PublicFileEntity, file => file.record) //todo remove from bucket
  file: PublicFileEntity;

  @ManyToOne(type => UsersEntity, user => user.records, { onDelete: "CASCADE", cascade: true })
  user: UsersEntity;

  @OneToMany(type => AnswersEntity, answers => answers.record)
  answers: AnswersEntity[];

  @OneToMany(type => LikesEntity, likes => likes.record)
  likes: LikesEntity[];

  @OneToMany(type => ReactionsEntity, reactions => reactions.record)
  reactions: ReactionsEntity[];

  @OneToMany(type => NotificationsEntity, notifications => notifications.record)
  notifications: NotificationsEntity[];

  @OneToMany(type => ReportsEntity, reports => reports.record)
  reports: ReportsEntity[];

  @AfterLoad()
  domainUrl() {
    if (this.file) {
      this.file.link = `${ConfigService.get('app.domain')}/files/${this.file.link}`;
    }
  }
}
