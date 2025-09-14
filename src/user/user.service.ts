import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<Omit<User, 'passwordHash'>> {
        const existing = await this.userRepository.findOne({ where: { email: createUserDto.email } });
        if (existing) {
            throw new ConflictException('Email already in use');
        }
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(createUserDto.password, salt);
        const user = this.userRepository.create({
            email: createUserDto.email,
            passwordHash,
        });
        const savedUser = await this.userRepository.save(user);
        const { passwordHash: _, ...userWithoutPassword } = savedUser;
        return userWithoutPassword;
    }

    async findAll(): Promise<User[]> {
        return this.userRepository.find();
    }

    async findById(id: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { id } });
    }

    async findByIdWithRefresh(id: string): Promise<User | null> {
        // refresh tokens are now stored in Redis; keep simple findById if needed
        return this.findById(id);
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email }, select: ['id', 'email', 'passwordHash', 'createdAt', 'updatedAt'] });
    }

    async update(id: string, updateData: Partial<User>): Promise<User | null> {
        await this.userRepository.update(id, updateData);
        return this.findById(id);
    }

    // setRefreshToken/clearRefreshToken removed - refresh tokens stored in Redis

    async remove(id: string): Promise<void> {
        await this.userRepository.delete(id);
    }
}