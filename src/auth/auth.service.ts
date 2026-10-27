import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { RegisterUserDto } from './dto/register-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokens } from './entities/refresh-tokens.entity';
import { createHash } from 'crypto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,  

    @InjectRepository(RefreshTokens)
    private readonly refreshTokensRepository: Repository<RefreshTokens>,

    private readonly jwtService: JwtService,
  ){}
  
  
  async login(loginUserDto: LoginUserDto){
    
    const user = await this.userRepository.findOne({
      where: {userName: loginUserDto.userName},
      select: {
        id: true,
        userName: true,
        password: true,
        role: true,
        isActive: true
      },
    });
    
    if(!user) throw new UnauthorizedException('User not found');
    if(!user.isActive) throw new UnauthorizedException('User is inactive');
    
    const userValid = await bcrypt.compare(loginUserDto.password, user.password);
    if(!userValid) throw new UnauthorizedException('Invalid credentials');
    
    const {accessToken, refreshToken} = await this.issueAtToken(user);
    
    return{
      accessToken,
      refreshToken
    };
  };
  
  async refresh(refreshToken: string){
    //Verificar que el token sea valido
    let payload: any;
    
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET
      });
    } catch (error) {
      console.log(error)
      throw new UnauthorizedException('Invalid Refresh Token')
    }
    
    //Buscamos ese token exacto entre los usuairos que no esten revokados

    const matchedToken = await this.refreshTokensRepository.findOne({
      where: {
        userId: payload.sub,
        token: this.hashRefreshToken(refreshToken),
        revoked: false
      }
    });
    
    if(!matchedToken) throw new UnauthorizedException('Refresh token revoked');
    
    
    //Verificamos que no haya expirado
    
    if(matchedToken.expiredAt < new Date()) throw new UnauthorizedException('Refresh token expired');
    
    //Generamos nuevo accessToken
    
    const user = await this.userRepository.findOne({
      where: {id: payload.sub},
      select: {id: true, userName: true, role: true}
    });
    
    if(!user) throw new UnauthorizedException('User not found');
    
    const newAccessToken = this.jwtService.sign(
      {sub: user.id, userName: user.userName, role: user.role},
      {secret: process.env.JWT_SECRET, expiresIn: '1d'}
    );
    
    return {
      accessToken: newAccessToken
    };
  };
  
  async logout(userId: string){
    await this.refreshTokensRepository.update(
      {userId: userId, revoked: false},
      {revoked: true}
    );
    
    return {message: 'Logged successfully'};
  };
  
  async registerUser(registerUserDto: RegisterUserDto) {
    try {
      const {userName, password} = registerUserDto;
      const passwordHash = bcrypt.hashSync(password, 10);

      const user = this.userRepository.create({
        userName,
        password: passwordHash
      });

      await this.userRepository.save(user);

      return { user };

    } catch (error) {
      return this.handleDBError(error)
    }
  };

  async findAllUsers() {
    const users = await this.userRepository.find();

    if(users.length === 0) throw new NotFoundException('Users not found');
    
    return users;
  };

  async updateUser(userId: string, updateUserDto: UpdateUserDto){
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = id', {userId})
      .getOne();

    if(!user) throw new NotFoundException('User not found');

    if(updateUserDto.password){
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    };

    Object.assign(user, updateUserDto);

    await this.userRepository.save(user);

    const {password, ...userReturn} = user;
    
    return {userReturn};
  };  

  async removeUser(userId: string) {
    const user = await this.userRepository.findOne({where: {id: userId}});

    if(!user) throw new NotFoundException('User not found');

    await this.userRepository.remove(user);

    return {message: `User with id ${user.id} deleted successfully`}
  };

  async issueAtToken(user: User){
    const accessToken = this.jwtService.sign(
      {sub: user.id, userName: user.userName, role: user.role},
      {secret: process.env.JWT_SECRET, expiresIn: '30m'}
    );

    const refreshToken = this.jwtService.sign(
      {sub: user.id},
      {secret: process.env.JWT_REFRESH_SECRET, expiresIn: '7d'}
    );

    await this.refreshTokensRepository.save({
      userId: user.id,
      token: this.hashRefreshToken(refreshToken),
      expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    return {
      accessToken,
      refreshToken
    };
  };

  private hashRefreshToken(token: string){
    return createHash('sha256').update(token).digest('hex');
  };

  handleDBError(error: any){
    if(error.code === '23505') throw new BadRequestException(error.detail);
    
      throw new InternalServerErrorException('Check server logs');
  };

};
