import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { GenderEnum } from "../lib/enum";

@Entity({ name: "admin" })
@Index(["email"])
export class AdminEntity {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ nullable: true })
  password: string;

  @Column({ unique: true })
  email: string;

  @Column({ default: null })
  name: string;

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
}
