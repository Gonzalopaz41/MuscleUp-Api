import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { RefreshTokens } from './entities/refresh-tokens.entity';
import { JwtStrategy } from './strategies/jwt.strategy';
import { JwtAuthGuard } from './guards/auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtAuthGuard],
  imports: [
    TypeOrmModule.forFeature([User, RefreshTokens]),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET
    })
  ]
})
export class AuthModule {}
