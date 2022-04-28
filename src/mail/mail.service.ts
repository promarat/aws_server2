import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from "../users/users.service";
import { RecordsService } from 'src/records/records.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import {notificationSettings}  from './notificationConfig';
import * as PushNotifications from 'node-pushnotifications';

@Injectable()
export class MailService {
    private logger = new Logger(MailService.name);
    private push = new PushNotifications(notificationSettings);
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
                subject: 'Welcome to Vocco! Confirm your Email',
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

    public sentNotify(registrationIds, description): any {
        let data = {title: 'Hi!', body: description, topic: 'org.RaiseYourVoice'};
        return this.push
            .send(registrationIds, data, (err,result)=>{
                
            })
    }

    async sentNotifyToUsers(description: string){
        const deviceTokens = await this.usersService.findDevices();
        this.sentNotify(deviceTokens, description);
    }

    async sentNotifyToUser(userId, description: string){
        let usersId = [];
        usersId.push(userId);
        const deviceTokens = await this.usersService.findDevicesWithUser(usersId);
        this.sentNotify(deviceTokens, description);
    }

    async sentNotifyToUsersHaveAnswer(description: string){
        const deviceTokens = await this.usersService.findDevicesWithAnswer();
        this.sentNotify(deviceTokens, description);
    }

    async sentNotifyToFriends(userId: string, description: string){
        const findUsers = await this.recordsService.findUsersByFriendId(userId);
        const usersId = findUsers.map((user)=>user.user.id);
        const deviceTokens = await this.usersService.findDevicesWithUser(usersId);
       this.sentNotify(deviceTokens, description);
    }


    public sentRecoverCode(code: string, email: string): any {
        return this
            .mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: 'Hi',
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
