import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn, OneToMany, AfterLoad
} from "typeorm";
import { PublicFileEntity } from "./public-file.entity";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";
import { LikesEntity } from "./llikes.entity";
import { GenderEnum } from "../lib/enum";
import { FriendsEntity } from "./friends.entity";
import { NotificationsEntity } from "./notification.entity";
import { ConfigService } from "nestjs-config";

@Entity({ name: "users" })
@Index(["email"])
export class UsersEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ default: null })
  pseudo: string;

  @Column({ select: false })
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({
    type: "timestamp",
    default: () => "CURRENT_TIMESTAMP"
  })
  lastActivity: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: null, type: "timestamp" })
  dob: Date;

  @Column({ default: false })
  isProfileCompleted: boolean;

  @Column({ default: false })
  isEmailVerified: boolean;

  @Column({
    nullable: true,
    type: 'enum',
    enum: GenderEnum,
  })
  gender: GenderEnum;

  @Column({nullable: true})
  country: string;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: "timestamp without time zone",
    name: "updatedAt"
  })
  updatedAt: Date;

  @OneToOne(
    () => PublicFileEntity,
    {
      eager: true,
      nullable: true
    }
  )
  @JoinColumn()
  public avatar?: PublicFileEntity;

  @OneToMany(type => RecordsEntity, records => records.user)
  records: RecordsEntity[];

  @OneToMany(type => AnswersEntity, answers => answers.user)
  answers: AnswersEntity[];

  @OneToMany(type => LikesEntity, likes => likes.user)
  likes: LikesEntity[];

  @OneToMany(type => FriendsEntity, from => from.user)
  from: FriendsEntity;

  @OneToMany(type => FriendsEntity, to => to.user)
  to: FriendsEntity;

  @OneToMany(type => NotificationsEntity, notificationsTo => notificationsTo.toUser)
  notificationsTo: NotificationsEntity;

  @OneToMany(type => NotificationsEntity, notificationsFrom => notificationsFrom.fromUser)
  notificationsFrom: NotificationsEntity;

  @AfterLoad()
  domainUrl() {
    if (this.avatar) {
      this.avatar.link = `${ConfigService.get('app.domain')}/img/${this.avatar.link}?auto=compress&q=20`;
    }
  }
}
