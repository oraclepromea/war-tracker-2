import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('news_items')
@Index(['publishedAt', 'source'])
@Index(['source', 'sourceId'], { unique: true })
export class NewsItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  source: string;

  @Column({ length: 255 })
  sourceId: string;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text' })
  url: string;

  @Column({ type: 'timestamptz' })
  publishedAt: Date;

  @Column({ type: 'text', nullable: true })
  summary: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', default: 5 })
  reliability: number; // 1-10 scale

  @Column({ type: 'text', array: true, default: '{}' })
  tags: string[];

  @Column({ length: 50, default: 'low' })
  severity: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}