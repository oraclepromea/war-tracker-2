import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('news_items')
export class NewsItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  source!: string;

  @Column()
  sourceId!: string;

  @Column()
  title!: string;

  @Column()
  url!: string;

  @Column()
  publishedAt!: Date;

  @Column()
  summary!: string;

  @Column()
  imageUrl!: string;

  @Column()
  reliability!: number;

  @Column('text', { array: true })
  tags!: string[];

  @Column()
  severity!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}