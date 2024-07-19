import {
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { NATS_SERVICE } from 'src/config';
import { CreateNotificationDto } from './dto';
import { firstValueFrom, lastValueFrom } from 'rxjs';

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

  async createNotification(createNotificationDto: CreateNotificationDto) {
    this.logger.log('Creating new notification', createNotificationDto);

    const { teamId, leagueId, eventType, message } = createNotificationDto;

    const subscriptions = await lastValueFrom(
      this.client.send('user.get.subscriptions', { teamId, leagueId }),
    );

    for (const subscription of subscriptions) {
      await this.notification.create({
        data: {
          userId: subscription.userId,
          subscriptionId: subscription.id,
          teamId,
          leagueId,
          eventType,
          message,
        },
      });
    }
  }

  async getUserNotifications(userId: string) {
    try {
      const userExists = await this.checkUserExists(userId);

      if (!userExists) {
        throw new RpcException({
          status: HttpStatus.NOT_FOUND,
          message: 'User not found',
        });
      }

      return this.notification.findMany({
        where: {
          userId,
        },
      });
    } catch ({ error }) {
      throw new RpcException({
        status: error.status || HttpStatus.BAD_REQUEST,
        message:
          error.message ||
          'An error occurred while fetching user notifications',
      });
    }
  }

  private async checkUserExists(userId: string): Promise<boolean> {
    const result = await firstValueFrom(
      this.client.send('user.exists', { userId }),
    );
    return result.exists;
  }
}
