import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { InviteUserDto } from './dto/invite-user.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all users in current organization' })
  async listOrgUsers(@CurrentUser() user: JwtPayload) {
    const users = await this.usersService.findByOrgId(user.orgId);
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      role: u.role,
      createdAt: u.createdAt,
    }));
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user to current organization' })
  async inviteUser(
    @CurrentUser() user: JwtPayload,
    @Body() dto: InviteUserDto,
  ) {
    const existing = await this.usersService.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    const newUser = await this.usersService.create({
      email: dto.email,
      passwordHash,
      displayName: dto.displayName,
      role: dto.role,
      organizationId: user.orgId,
    });

    return {
      id: newUser.id,
      email: newUser.email,
      displayName: newUser.displayName,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }
}
