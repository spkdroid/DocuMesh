import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import {
  CreateTemplateDto,
  UpdateTemplateDto,
  CreateSnippetDto,
  UpdateSnippetDto,
} from './dto/templates.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('Templates & Snippets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('templates')
export class TemplatesController {
  constructor(private readonly templatesService: TemplatesService) {}

  // === Templates ===

  @Post()
  @ApiOperation({ summary: 'Create a content template' })
  createTemplate(@CurrentUser() user: JwtPayload, @Body() dto: CreateTemplateDto) {
    return this.templatesService.createTemplate(user.orgId, user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all templates' })
  @ApiQuery({ name: 'search', required: false })
  findAllTemplates(
    @CurrentUser() user: JwtPayload,
    @Query('search') search?: string,
  ) {
    return this.templatesService.findAllTemplates(user.orgId, search);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a template by ID' })
  findOneTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.findOneTemplate(user.orgId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a template' })
  updateTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ) {
    return this.templatesService.updateTemplate(user.orgId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a template' })
  removeTemplate(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.removeTemplate(user.orgId, id);
  }

  // === Snippets ===

  @Post('snippets')
  @ApiOperation({ summary: 'Create a snippet' })
  createSnippet(@CurrentUser() user: JwtPayload, @Body() dto: CreateSnippetDto) {
    return this.templatesService.createSnippet(user.orgId, user.sub, dto);
  }

  @Get('snippets/all')
  @ApiOperation({ summary: 'List all snippets' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAllSnippets(
    @CurrentUser() user: JwtPayload,
    @Query('category') category?: string,
    @Query('search') search?: string,
  ) {
    return this.templatesService.findAllSnippets(user.orgId, category, search);
  }

  @Get('snippets/:id')
  @ApiOperation({ summary: 'Get a snippet by ID' })
  findOneSnippet(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.findOneSnippet(user.orgId, id);
  }

  @Patch('snippets/:id')
  @ApiOperation({ summary: 'Update a snippet' })
  updateSnippet(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSnippetDto,
  ) {
    return this.templatesService.updateSnippet(user.orgId, id, dto);
  }

  @Delete('snippets/:id')
  @ApiOperation({ summary: 'Delete a snippet' })
  removeSnippet(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.templatesService.removeSnippet(user.orgId, id);
  }
}
