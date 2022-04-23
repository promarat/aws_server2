import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from "../users/users.service";
import { RecordsService } from 'src/records/records.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';

@Injectable()
export class MailService {
    private logger = new Logger(MailService.name);
    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService,
        private readonly usersService: UsersService,
        private readonly recordsService: RecordsService,
        
    ) {
    }
    
    public sentVerificationCode(code: string, email: string): any {
        return this
            .mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'Welcome to Raise Your Voice! Confirm your Email',
                template: './index', // './' bugfix, undocumented in docs
                context: {code},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
    }

    public sentNotify(email: string, description: string, username: string): any {
        return this
            .mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'Welcome to Raise Your Voice! Confirm your Email',
                template: './notice', // './' bugfix, undocumented in docs
                context: {username, description},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
    }

    async sentNotifyToUsers(description: string, username: string){
        const emails = await this.usersService.findEmails();
        emails.map((email,index)=>{
            this.mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'Hello',
                template: './notice', // './' bugfix, undocumented in docs
                context: {username, description},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
        })
    }

    async sentNotifyToUsersHaveAnswer(description: string, username: string){
        const emails = await this.usersService.findEmailsWithAnswer();
        emails.map((email,index)=>{
            this.mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'Hello',
                template: './notice', // './' bugfix, undocumented in docs
                context: {username, description},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
        })
    }

    async sentNotifyToFriends(userId: string, description: string, username: string){
        const findUsers = await this.recordsService.findUsersByFriendId(userId);
        const emails = findUsers.map((user)=>user.user.email);
        emails.map((email,index)=>{
            this.mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'Hello',
                template: './notice', // './' bugfix, undocumented in docs
                context: {username, description},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
        })
    }


    public sentRecoverCode(code: string, email: string): any {
        return this
            .mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'HI',
                template: './index', // './' bugfix, undocumented in docs
                context: {code},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
    }

}
