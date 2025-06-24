import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('weapons')
export class Weapon {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  category!: string;

  @Column()
  rangeKm!: number;

  @Column()
  payloadKg!: number;

  @Column('decimal')
  unitCostUsd!: number;

  @Column()
  originCountry!: string;

  @Column()
  imageUrl!: string;

  @Column()
  description!: string;

  @Column()
  speed!: number;

  @Column()
  quantity!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}