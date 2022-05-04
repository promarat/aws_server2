import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UsersEntity } from "./users.entity";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";

export enum LikeTypeEnum {
  RECORD = "record",
  ANSWER = "answer"
}

@Entity({ name: "likes" })
export class LikesEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: LikeTypeEnum })
  type: LikeTypeEnum;

  @Column({default: null})
  emoji: string;

  @Column({default: true})
  isLike: boolean;

  @ManyToOne(() => UsersEntity, (user) => user.likes, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  user: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.likes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  record: RecordsEntity;

  @ManyToOne(() => AnswersEntity, (answer) => answer.likes, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  answer: AnswersEntity;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date; 
}
