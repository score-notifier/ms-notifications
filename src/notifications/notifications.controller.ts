import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { CreateNotificationDto, CreateSubscriptionDto } from './dto';
import { NotificationsService } from './notifications.service';

@Controller()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @MessagePattern('notification.subscribe.team')
  async createUser(@Payload() createSubscriptionDto: CreateSubscriptionDto) {
    return this.notificationsService.createSubscription(createSubscriptionDto);
  }

  @MessagePattern('notification.match.event')
  async subscribeToTeam(
    @Payload() createNotificationDto: CreateNotificationDto,
  ) {
    return this.notificationsService.createNotification(createNotificationDto);
  }
}
