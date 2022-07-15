import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { UsersEntity } from "./users.entity";
import { RecordsEntity } from "./records.entity";
// import { AnswersEntity } from "./answers.entity";

@Entity({ name: "reactions" })
export class ReactionsEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({default: null})
  emoji: string;

  @ManyToOne(() => UsersEntity, (user) => user.reactions, {
    nullable: false,
    onDelete: "CASCADE",
    cascade: true
  })
  user: UsersEntity;

  @ManyToOne(() => RecordsEntity, (record) => record.reactions, {
    nullable: true,
    onDelete: "CASCADE",
    cascade: true
  })
  record: RecordsEntity;

//   @ManyToOne(() => AnswersEntity, (answer) => answer.reactions, {
//     nullable: true,
//     onDelete: "CASCADE"
//   })
//   answer: AnswersEntity;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date; 
}
