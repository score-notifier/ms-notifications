import { Controller, ParseUUIDPipe } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateNotificationDto } from './dto';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern('notification.match.event')
  async subscribeToTeam(
    @Payload() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @MessagePattern('notification.get.all')
  async getUserNotifications(@Payload('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }
}
