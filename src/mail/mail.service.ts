import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from "../users/users.service";
import { RecordsService } from 'src/records/records.service';
import { ConsoleLogger, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import {notificationSettings}  from './notificationConfig';
import * as PushNotifications from 'node-pushnotifications';

@Injectable()
export class MailsService {
    private logger = new Logger(MailsService.name);
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

    public sendEmailToAdmin(type: string, user: string, email: string): any {
        return this
            .mailerService
            .sendMail({
                to: email,
                from: this.configService.get('app.smtp_mail'),
                subject: type === "subscribe" ? 'New User Is Registered' : "Premium User Is Registered!",
                template: './index', // './' bugfix, undocumented in docs
                context: {user},
            })
            .then((success) => {
                this.logger.log(success)
            })
            .catch((err) => {
                this.logger.error(err)
            });
    }

    public sentNotify(registrationIds, description, params): any {
        let data = {title: 'Vocco', body: description, topic: 'org.RaiseYourVoice', custom: params, invokeApp:false};
        return this.push
            .send(registrationIds, data, (err,result)=>{
                console.log(err);
            })
    }

    async sentNotifyToUsers(description, params){
        const deviceTokens = await this.usersService.findDevices();
        this.sentNotify(deviceTokens, description, params);
    }

    async sentNotifyToUser(usersId, description, params){
        const deviceTokens = await this.usersService.findDevicesWithUser(usersId);
        this.sentNotify(deviceTokens, description, params);
    }

    async sentNotifyToUsersHaveAnswer(description, params){
        const deviceTokens = await this.usersService.findDevicesWithAnswer();
        this.sentNotify(deviceTokens, description, params);
    }

    async sentNotifyToFriends(userId, description, params){
        const findUsers = await this.recordsService.findUsersByFriendId(userId);
        const usersId = findUsers.map((user)=>user.user.id);
        const deviceTokens = await this.usersService.findDevicesWithUser(usersId);
       this.sentNotify(deviceTokens, description,params);
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
