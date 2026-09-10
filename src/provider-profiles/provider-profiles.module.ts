import { Module } from '@nestjs/common';
import { ProviderProfilesController } from './provider-profiles.controller';
import { ProviderProfilesService } from './provider-profiles.service';

@Module({
  controllers: [ProviderProfilesController],
  providers: [ProviderProfilesService],
})
export class ProviderProfilesModule {}
