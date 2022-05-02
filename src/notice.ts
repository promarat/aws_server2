import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { MailService } from './mail/mail.service';
import { CronJob } from 'cron';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private mailService: MailService,
    private schedulerRegistry: SchedulerRegistry
  ){
  }

  @Cron('16 */2 * *')
  async anythingHappen() {
    this.logger.debug('Called at 6 pm every 2 days');
    await this.mailService.sentNotifyToUsers('Anything happened to you today? Say it!');
  }

  @Cron('30 10 * * *')
  async answerThem() {
    this.logger.debug('Called at 12.30 pm every day');
    await this.mailService.sentNotifyToUsersHaveAnswer('You have answers, answer them!');
  }
}