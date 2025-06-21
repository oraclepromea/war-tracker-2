import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToMany, JoinTable } from 'typeorm';
import { Weapon } from './Weapon';

@Entity('attacks')
@Index(['date', 'attackerCountry', 'defenderCountry'])
@Index(['source', 'sourceId'], { unique: true })
export class Attack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  source: string;

  @Column({ length: 255 })
  sourceId: string;

  @Column({ type: 'timestamptz' })
  date: Date;

  @Column({ length: 100 })
  attackerCountry: string;

  @Column({ length: 100 })
  defenderCountry: string;

  @Column({ length: 255 })
  locationName: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @ManyToMany(() => Weapon)
  @JoinTable({
    name: 'attack_weapons',
    joinColumn: { name: 'attackId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'weaponId', referencedColumnName: 'id' }
  })
  weaponsUsed: Weapon[];

  @Column({ type: 'int', default: 0 })
  fatalities: number;

  @Column({ type: 'int', default: 0 })
  injuries: number;

  @Column({ type: 'bigint', nullable: true })
  costOfDamageUsd: number;

  @Column({ type: 'text', array: true, default: '{}' })
  sourceUrls: string[];

  @Column({ length: 50, default: 'unknown' })
  attackType: string; // 'airstrike', 'missile', 'ground', 'naval'

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 50, default: 'medium' })
  severity: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}