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

  @ManyToOne(() => UsersEntity, (user) => user.likes, {
    nullable: false,
    onDelete: "CASCADE"
  })
  user: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.likes, {
    nullable: true,
    onDelete: "CASCADE"
  })
  record: RecordsEntity;

  @ManyToOne(() => AnswersEntity, (answer) => answer.likes, {
    nullable: true,
    onDelete: "CASCADE"
  })
  answer: AnswersEntity;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;
}
