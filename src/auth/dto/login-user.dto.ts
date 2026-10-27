import { IsString, MaxLength, MinLength } from "class-validator";

export class LoginUserDto{

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  userName!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(72)
  password!: string;

};