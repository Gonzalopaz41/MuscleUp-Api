import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { Role } from "../entities/user.entity";

export class RegisterUserDto {

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  userName!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(72)
  password!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
