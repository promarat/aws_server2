import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UsersEntity } from "./users.entity";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";
import { NotificationTypeEnum } from "../lib/enum";
import { FriendsEntity } from "./friends.entity";

@Entity({ name: 'notification'})
export class NotificationsEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: NotificationTypeEnum })
  type: NotificationTypeEnum;

  @Column({ type: "boolean", default: false })
  seen: boolean;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @ManyToOne(() => FriendsEntity, (friend) => friend.notification, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  friend: FriendsEntity;

  @ManyToOne(() => FriendsEntity, (friend) => friend.notification, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  towardFriend: FriendsEntity;

  @ManyToOne(() => UsersEntity, (fromUser) => fromUser.notificationsFrom, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  fromUser: UsersEntity;

  @ManyToOne(() => UsersEntity, (toUser) => toUser.notificationsTo, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  toUser: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.notifications, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  record: RecordsEntity;

  @ManyToOne(() => AnswersEntity, (answer) => answer.notifications, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  answer: AnswersEntity;


}
