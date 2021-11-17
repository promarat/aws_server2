import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';

@Injectable()
export class MailService {
    private logger = new Logger(MailService.name);
    constructor(
        private readonly mailerService: MailerService,
        private readonly configService: ConfigService
    ) {
    }

    public sentVerificationCode(code: string, email: string): any {
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
