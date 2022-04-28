import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MailService } from './mail/mail.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);
  constructor(
    private mailService: MailService,
  ){
  }

  @Cron('* * 18 */2 * *')
  anythingHappen() {
    this.logger.debug('Called at 6 pm every 2 days');
    this.mailService.sentNotifyToUsers('Anything happened to you today? Say it!');
  }

  @Cron('* 30 12 * * *')
  answerThem() {
    this.logger.debug('Called at 12.30 pm every day');
    this.mailService.sentNotifyToUsersHaveAnswer('You have answers, answer them!');
  }
  @Cron('* * * * * *')
    triggerCronJob() {
      console.log("Calling the method every second");
    }
}