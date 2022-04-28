import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn
} from "typeorm";

import { UsersEntity } from "./users.entity";

@Entity({ name: "devices" })
export class DevicesEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  token: string;

  @Column({ nullable: true })
  os: string;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;

  @ManyToOne(type => UsersEntity, user => user.devices, { onDelete: "CASCADE", cascade: true })
  user: UsersEntity;
}
