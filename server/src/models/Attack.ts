import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Weapon } from './Weapon';

@Entity('attacks')
export class Attack {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  source!: string;

  @Column()
  sourceId!: string;

  @Column()
  date!: Date;

  @Column()
  attackerCountry!: string;

  @Column()
  defenderCountry!: string;

  @Column()
  locationName!: string;

  @Column('decimal')
  latitude!: number;

  @Column('decimal')
  longitude!: number;

  @ManyToMany(() => Weapon)
  @JoinTable()
  weaponsUsed!: Weapon[];

  @Column()
  fatalities!: number;

  @Column()
  injuries!: number;

  @Column('decimal')
  costOfDamageUsd!: number;

  @Column('text', { array: true })
  sourceUrls!: string[];

  @Column()
  attackType!: string;

  @Column()
  description!: string;

  @Column()
  severity!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}