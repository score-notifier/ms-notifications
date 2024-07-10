import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { CreateNotificationDto, CreateSubscriptionDto } from './dto';

@Injectable()
export class NotificationsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Database connected');
  }

  async createSubscription(createSubscriptionDto: CreateSubscriptionDto) {
    this.logger.log('creating new subscription', createSubscriptionDto);

    const { userId, teamId, leagueId } = createSubscriptionDto;

    await this.subscription.create({
      data: {
        userId,
        teamId,
        leagueId,
        active: true,
      },
    });
  }

  async createNotification(createNotificationDto: CreateNotificationDto) {
    this.logger.log('Creating new notification', createNotificationDto);

    const { teamId, leagueId, eventType, message } = createNotificationDto;

    const subscriptions = await this.subscription.findMany({
      where: {
        teamId,
        leagueId,
        active: true,
      },
    });

    for (const subscription of subscriptions) {
      await this.notification.create({
        data: {
          userId: subscription.userId,
          teamId,
          leagueId,
          eventType,
          message,
        },
      });
    }
  }
}
