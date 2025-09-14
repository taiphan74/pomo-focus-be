import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index({ unique: true })
    @Column({ type: 'varchar', length: 255 })
    email: string;

    @Column({ type: 'boolean', default: false })
    isActive: boolean;

    @Column({ type: 'varchar', length: 255, select: false })
    passwordHash: string;

    // refreshTokenHash removed: refresh tokens are stored in Redis (REDIS_AUTH) now

    @CreateDateColumn({ type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updatedAt: Date;
}
