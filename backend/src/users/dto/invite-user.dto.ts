import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class InviteUserDto {
  @ApiProperty({ example: 'reviewer@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'tempPassword123' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'John Reviewer' })
  @IsString()
  @IsNotEmpty()
  displayName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.REVIEWER })
  @IsEnum(UserRole)
  role: UserRole;
}
