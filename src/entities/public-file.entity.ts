import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RecordsEntity } from "./records.entity";
import { AnswersEntity } from "./answers.entity";
import { FileTypeEnum } from "../lib/enum";

@Entity({ name: "s3_files" })
export class PublicFileEntity {

  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  url: string;

  @Column({
    nullable: true,
    type: 'enum',
    enum: FileTypeEnum,
  })
  type: FileTypeEnum;

  @Column({ default: null })
  link: string;

  @Column()
  public key: string;

  @OneToOne(type => RecordsEntity, record => record.file)
  record: RecordsEntity;

  @OneToOne(type => AnswersEntity, answer => answer.file)
  answer: AnswersEntity;

}
