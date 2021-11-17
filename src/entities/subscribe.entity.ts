import { Column, Entity, CreateDateColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'subscribe'})
export class SubScribeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({default: null})
  email: string;

  @CreateDateColumn({
    type: "timestamp without time zone",
    name: "createdAt"
  })
  createdAt: Date;
}