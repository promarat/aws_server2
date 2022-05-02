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
  ){}

  @Cron('0 0 18 */2 * *')
  anythingHappen() {
    this.logger.debug('Called at 6 pm every 2 days');
    this.mailService.sentNotifyToUsers('Anything happened to you today? Say it!');
  }

  @Cron('0 * * * * *')
  answerThem() {
    this.logger.debug('Called at 12.30 pm every day');
    this.mailService.sentNotifyToUsersHaveAnswer('You have answers, answer them!');
    console.log("URAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
  }
}