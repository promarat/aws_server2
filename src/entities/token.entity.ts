import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({name: 'refresh_token'})
export class RefreshTokenEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({default: null})
  value: string;

  @Column({default: null})
  userId: string;

  @Column({default: null})
  expiresAt: Date;

  @Column({default: null})
  ipAddress: string;
}