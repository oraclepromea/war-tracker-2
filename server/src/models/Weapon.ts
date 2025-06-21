import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('weapons')
@Index(['category', 'originCountry'])
@Index(['name'], { unique: true })
export class Weapon {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @Column({ length: 50 })
  category: string; // 'aircraft', 'missiles', 'tanks', 'ships', 'vehicles'

  @Column({ type: 'int', nullable: true })
  rangeKm: number;

  @Column({ type: 'int', nullable: true })
  payloadKg: number;

  @Column({ type: 'bigint', nullable: true })
  unitCostUsd: number;

  @Column({ length: 100 })
  originCountry: string;

  @Column({ type: 'text', nullable: true })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', nullable: true })
  speed: number; // km/h or mach

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}