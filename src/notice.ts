import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { MailsService } from './mail/mail.service';
import { CronJob } from 'cron';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private mailService: MailsService,
    private schedulerRegistry: SchedulerRegistry
  ){
  }

  @Cron('0 16 */2 * *')
  async anythingHappen() {
    this.logger.debug('Called at 6 pm every 2 days');
    //await this.mailService.sentNotifyToUsers('Anything happened to you today? Say it!',{nav:"HoldRecord",params:{}});
    await this.mailService.sentNotifyToUsers("Il vous est arrivé quelque chose aujourd'hui ? Dites-le ! 👀",{nav:"Feed",params:{}});
  }

  @Cron('30 10 * * *')
  async answerThem() {
    this.logger.debug('Called at 12.30 pm every day');
    //await this.mailService.sentNotifyToUsersHaveAnswer('You have answers, answer them!',{nav:"Notification",params:{}});
    await this.mailService.sentNotifyToUsersHaveAnswer("Vous avez des réponses, répondez-leurs ! 😈",{nav:"Notification",params:{}});
  }
}