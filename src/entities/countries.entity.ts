import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

@Entity({ name: 'countries' })
@Index(["countryCode"])
export class CountryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({default: null})
  countryCode: string;

  @Column({default: null})
  country: string;

}