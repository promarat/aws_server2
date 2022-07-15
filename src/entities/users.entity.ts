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
import { DevicesEntity} from "./device.entity"
import { AnswersEntity } from "./answers.entity";
import { LikesEntity } from "./llikes.entity";
import { GenderEnum } from "../lib/enum";
import { PremiumEnum } from "../lib/enum";
import { FriendsEntity } from "./friends.entity";
import { NotificationsEntity } from "./notification.entity";
import { ConfigService } from "nestjs-config";
import { ReportsEntity } from "./reports.entity";
import { ReactionsEntity } from "./reaction.entity";
import { TagsEntity } from "./tag.entity";
import { HistoryEntity } from "./history.entity";
import { ReplyAnswersEntity } from "./reply-answer.entity";
import { MessagesEntity } from "./message.entity";
import { ConversationsEntity } from "./conversations.entity";

@Entity({ name: "users" })
@Index(["email"])
export class UsersEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ default: null })
  pseudo: string;

  @Column({ nullable: true })
  password: string;

  @Column({nullable: true, unique: true })
  email: string;

  @Column({ default: null })
  name: string;

  @Column({ nullable: true, unique: true})
  phoneNumber: string;

  @Column({ default: false })
  public isPhoneNumberConfirmed: boolean;

  @Column({ default: null })
  bio: string;

  @Column({ default: null })
  firstname: string;

  @Column({ default: null })
  lastname: string;

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

  @Column({ default: false })
  isPrivate: boolean;

  @Column({
    nullable: true,
    type: 'enum',
    enum: GenderEnum,
  })
  gender: GenderEnum;

  @Column({
    default:PremiumEnum.NONE,
    type: 'enum',
    enum: PremiumEnum,
  })
  premium: PremiumEnum;

  @Column({ nullable: true, default: 0,  })
  avatarNumber: number;
  
  @Column({nullable: true})
  country: string;

  @Column({ nullable: true , default: 0})
  shareLinkCount: number

  @Column({ nullable: true , default: 0})
  openAppCount: number

  @Column({ nullable: true , default: 0})
  totalSession: number
  
  @Column({ default: false })
  isRegisteredWithGoogle: boolean;
  
  @Column({ default: null })
  newemail: string;

  @Column({ default: null })
  newpseudo: string;

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

  @JoinColumn()
  @OneToOne(
    type => PublicFileEntity, avatar => avatar.user,
    {
      eager: true,
      nullable: true
    }
  )
  avatar: PublicFileEntity;

  @OneToMany(type => RecordsEntity, records => records.user)
  records: RecordsEntity[];

  @OneToMany(type => HistoryEntity, history => history.user)
  history: HistoryEntity[];

  @OneToMany(type => DevicesEntity, devices => devices.user)
  devices: DevicesEntity[];

  @OneToMany(type => AnswersEntity, answers => answers.user)
  answers: AnswersEntity[];

  @OneToMany(type => ReplyAnswersEntity, replyAnswers => replyAnswers.user)
  replyAnswers: ReplyAnswersEntity[];

  @OneToMany(type => MessagesEntity, sentMessages => sentMessages.user)
  sentMessages: MessagesEntity[];

  @OneToMany(type => MessagesEntity, receivedMessages => receivedMessages.toUser)
  receivedMessages: MessagesEntity[];

  @OneToMany(type => LikesEntity, likes => likes.user)
  likes: LikesEntity[];

  @OneToMany(type => TagsEntity, tags => tags.user)
  tags: TagsEntity[];

  @OneToMany(type => ReactionsEntity, reactions => reactions.user)
  reactions: ReactionsEntity[];

  @OneToMany(type => FriendsEntity, from => from.user)
  from: FriendsEntity[];

  @OneToMany(type => FriendsEntity, to => to.friend)
  to: FriendsEntity[];

  @OneToMany(type => ConversationsEntity, firstConversation => firstConversation.sender)
  firstConversation: ConversationsEntity[];

  @OneToMany(type => ConversationsEntity, secondConversation => secondConversation.receiver)
  secondConversation: ConversationsEntity[];

  @OneToMany(type => NotificationsEntity, notificationsTo => notificationsTo.toUser)
  notificationsTo: NotificationsEntity;

  @OneToMany(type => NotificationsEntity, notificationsFrom => notificationsFrom.fromUser)
  notificationsFrom: NotificationsEntity;

  @OneToMany(type => ReportsEntity, reportFrom => reportFrom.reporter)
  reportFrom: ReportsEntity;

  @OneToMany(type => ReportsEntity, reportTo => reportTo.target)
  reportTo: ReportsEntity;

  @AfterLoad()
  domainUrl() {
    if (this.avatar) {
      this.avatar.link = `${ConfigService.get('app.domain')}/img/${this.avatar.link}?auto=compress&q=20`;
    }
  }
}
