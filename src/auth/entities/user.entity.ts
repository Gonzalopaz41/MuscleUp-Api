import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import {Exclude} from 'class-transformer'

export enum Role {
  Base = 'base',
  Admin = 'admin'
};


@Entity('users')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    name: 'user_name',
    type: 'text',
    unique: true
  })
  userName!: string;

  @Column({
    type: 'text',
    select: false
  })
  @Exclude()
  password!: string;

  @Column({
    name: 'is_active',
    type: 'bool',
    default: true
  })
  isActive!: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.Base
  })
  role!: Role

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamp',
    
  })
  createdAt!: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamp'
  })
  updatedAt!: Date;
}
