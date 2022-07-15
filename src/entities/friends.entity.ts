import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UsersEntity } from "./users.entity";
import { FriendsStatusEnum } from "../lib/enum";
import { NotificationsEntity } from "./notification.entity";

@Entity({name: 'friends'})
export class FriendsEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UsersEntity, (user) => user.from, { onDelete: "CASCADE", cascade:true })
  user: UsersEntity;

  @ManyToOne(() => UsersEntity, (user) => user.to, { onDelete: "CASCADE", cascade:true })
  friend: UsersEntity;

  @Column({default: true})
  suggest: boolean;

  @Column({default: false})
  invite: boolean;

  @OneToMany(() => NotificationsEntity, (notification) => notification.friend)
  notification: NotificationsEntity;

  @Column({
    nullable: true,
    type: "enum",
    enum: FriendsStatusEnum
  })
  status: FriendsStatusEnum;

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
}
