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
    try {
      this.logger.log('Creating new notification', createNotificationDto);

      const {
        homeTeamLiveScoreURL,
        awayTeamLiveScoreURL,
        matchLiveScoreURL,
        leagueLiveScoreURL,
        event,
      } = createNotificationDto;

      const [league, homeTeam, awayTeam] = await Promise.all([
        lastValueFrom(
          this.client.send('competitions.league.url', {
            scoreLiveURL: leagueLiveScoreURL,
          }),
        ),
        lastValueFrom(
          this.client.send('competitions.team.url', {
            scoreLiveURL: homeTeamLiveScoreURL,
          }),
        ),
        lastValueFrom(
          this.client.send('competitions.team.url', {
            scoreLiveURL: awayTeamLiveScoreURL,
          }),
        ),
      ]);

      if (!league || !homeTeam || !awayTeam) {
        this.logger.error('League, home team or away team not found', {
          league,
          homeTeam,
          awayTeam,
        });
        throw new RpcException({
          message: 'League, home team or away team not found',
        });
      }

      this.logger.log('league, homeTeam, awayTeam', league, homeTeam, awayTeam);

      const subscriptions = await Promise.all([
        lastValueFrom(
          this.client.send('user.get.subscriptions.all', {
            teamId: homeTeam.id,
            leagueId: league.id,
          }),
        ),
        lastValueFrom(
          this.client.send('user.get.subscriptions.all', {
            teamId: awayTeam.id,
            leagueId: league.id,
          }),
        ),
      ]);

      this.logger.debug('subscriptions', subscriptions.flat());

      const message =
        `${event.minute} ${event.eventType}` +
        (event.homePlayer ? `: ${homeTeam.name} - ${event.homePlayer}` : '') +
        (event.awayPlayer ? `: ${awayTeam.name} - ${event.awayPlayer}` : '');

      for (const subscription of subscriptions.flat()) {
        await this.notification.create({
          data: {
            matchLiveScoreURL,
            userId: subscription.userId,
            subscriptionId: subscription.id,
            teamId: subscription.teamId,
            leagueId: subscription.id,
            eventType: event.eventType,
            message,
          },
        });
      }

      this.logger.log('Notifications created successfully');
    } catch (error) {
      this.logger.error('Error creating notification', error);
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message:
          error.message ||
          'An error occurred while fetching user notifications',
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
      this.logger.error('Error fetching user notifications', error);
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
