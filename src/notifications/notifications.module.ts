import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService],
  imports: [NatsModule],
})
export class NotificationsModule {}
