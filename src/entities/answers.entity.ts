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
import { RecordsEntity } from "./records.entity";
import { LikesEntity } from "./llikes.entity";
import { NotificationsEntity } from "./notification.entity";
import { ConfigService } from "nestjs-config";

@Entity({ name: "answers" })
export class AnswersEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  duration: string;

  @Column({ nullable: true, default: 0 })
  likesCount: number;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @JoinColumn()
  @OneToOne(type => PublicFileEntity, file => file.answer) //todo remove from bucket
  file: PublicFileEntity;

  @ManyToOne(type => UsersEntity, user => user.answers, { onDelete: "CASCADE", cascade: true })
  user: UsersEntity;

  @ManyToOne(type => RecordsEntity, record => record.answers) //todo remove with record?
  record: RecordsEntity;

  @OneToMany(type => LikesEntity, likes => likes.answer) //todo remove with record?
  likes: LikesEntity[];

  @OneToMany(type => NotificationsEntity, notifications => notifications.answer)
  notifications: NotificationsEntity[];

  @AfterLoad()
  domainUrl() {
    if (this.file) {
      this.file.link = `${ConfigService.get('app.domain')}/files/${this.file.link}`;
    }
  }
}
