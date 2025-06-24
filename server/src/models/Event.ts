import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  source!: string;

  @Column()
  sourceId!: string;

  @Column()
  date!: Date;

  @Column()
  country!: string;

  @Column('decimal')
  latitude!: number;

  @Column('decimal')
  longitude!: number;

  @Column()
  description!: string;

  @Column('text', { array: true })
  urls!: string[];

  @Column()
  severity!: string;

  @Column('text', { array: true })
  tags!: string[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}