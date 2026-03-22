import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionLabel } from './entities/version-label.entity';
import { ContentBranch } from './entities/content-branch.entity';
import { BranchSnapshot } from './entities/branch-snapshot.entity';
import { Baseline } from './entities/baseline.entity';
import { Release } from './entities/release.entity';
import { ContentVersion } from '../content/entities/content-version.entity';
import { ContentItem } from '../content/entities/content-item.entity';
import { VersioningService } from './versioning.service';
import { VersioningController } from './versioning.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      VersionLabel,
      ContentBranch,
      BranchSnapshot,
      Baseline,
      Release,
      ContentVersion,
      ContentItem,
    ]),
  ],
  controllers: [VersioningController],
  providers: [VersioningService],
  exports: [VersioningService],
})
export class VersioningModule {}
