import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./user.entity";

@Entity('refresh_tokens')
export class RefreshTokens {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(()=> User, {onDelete:'CASCADE'})
  @JoinColumn({name:'user_id'})
  user!: User;

  @Column({name: 'user_id'})
  userId!: string;

  @Column('text')
  token!: string;

  @Column('bool', {default: false})
  revoked!: boolean;

  @CreateDateColumn({
    name:'created_at',
    type: 'timestamp'
  })
  createdAt!: Date;

  @Column('timestamp',{
    name: 'expired_at'
  })
  expiredAt!: Date;
  
}