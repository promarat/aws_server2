import {Column, CreateDateColumn, Entity, PrimaryGeneratedColumn} from "typeorm";


@Entity('password_reset')
export class PasswordResetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: "uuid" })
  userId: string;

  @Column()
  token: string;

  @CreateDateColumn( {type: "timestamp"} )
  createdAt: Date;

  @Column()
  expiredAt: Date;

}
