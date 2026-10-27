import { Controller, Get, Post, Body, Patch, Param, Delete, Request, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { JwtAuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from './entities/user.entity';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  login(@Body() loginUserDto: LoginUserDto){
    return this.authService.login(loginUserDto)
  };

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto){
    return this.authService.refresh(refreshTokenDto.refreshToken);
  };

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Request() req){
    return this.authService.logout(req.user.sub);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Get('users')
  findAllUsers() {
    return this.authService.findAllUsers();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.Admin)
  @Patch('users/:userId')
  updateUser(@Param('userId', ParseUUIDPipe) userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(userId, updateUserDto);
  }

  @Delete('users/:userId')
  remove(@Param('userId') userId: string) {
    return this.authService.removeUser(userId);
  }
}
