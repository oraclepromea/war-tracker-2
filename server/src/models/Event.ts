import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('events')
@Index(['date', 'country'])
@Index(['source', 'sourceId'], { unique: true })
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  source: string; // 'acled', 'gdelt', 'reuters', etc.

  @Column({ length: 255 })
  sourceId: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ length: 100 })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', array: true, default: '{}' })
  urls: string[];

  @Column({ length: 50, default: 'unknown' })
  severity: string; // 'low', 'medium', 'high', 'critical'

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}