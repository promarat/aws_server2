import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UsersEntity } from "./users.entity";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";

export enum ReportTypeEnum {
    Spam = "Spam",
    FakeAccount = "FakeAccount",
    Violence = "Violence",
    ChildAbuse = "ChildAbuse",
    Other = "Other"
}

@Entity({ name: "reports" })
export class ReportsEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "enum", enum: ReportTypeEnum })
  type: ReportTypeEnum;

  @ManyToOne(() => UsersEntity, (user) => user.reportFrom, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  reporter: UsersEntity;

  @ManyToOne(() => UsersEntity, (user) => user.reportTo, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  target: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.reports, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  record: RecordsEntity;

  @ManyToOne(() => AnswersEntity, (answer) => answer.reports, {
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
