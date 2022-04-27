import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from "@nestjs/passport";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { RefreshTokenEntity } from "../entities/token.entity";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { UsersService } from "../users/users.service";
import { LocalStrategy } from "./strategies/local.strategy";
import { MailService } from "../mail/mail.service";
import { TokenService } from "./token/token.service";
import { JwtMiddleware } from "./middleware/jwt.middleware";
import { LocalMiddleware } from "./middleware/local.middleware";
import { PasswordResetEntity } from "../entities/reset-password.entity";
import { FileService } from "../files/file.service";
import { PublicFileEntity } from "../entities/public-file.entity";
import { AccountController } from "../account/account.controller";
import { UsersController } from "../users/users.controller";
import { ActionsController } from "../actions/actions.controller";
import { FilesController } from "../files/files.controller";
import { RecordsController } from "../records/records.controller";
import { SubScribeService } from "./subscripbe/subscribe.service";
import { SubScribeEntity } from "../entities/subscribe.entity";
import { NotificationsController } from "src/notifications/notifications.controller";
import { RecordsService } from "src/records/records.service";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { LikesEntity } from "src/entities/llikes.entity";
import { ReactionsEntity } from "src/entities/reaction.entity";
import { FriendsEntity } from "src/entities/friends.entity";
import { DevicesEntity } from "src/entities/device.entity";

@Module({
  imports: [
    PassportModule.register({defaultStrategy: "jwt"}),
    TypeOrmModule.forFeature(
      [
        UsersEntity,
        RefreshTokenEntity,
        PasswordResetEntity,
        PublicFileEntity,
        SubScribeEntity,
        RecordsEntity,
        AnswersEntity,
        LikesEntity,
        ReactionsEntity,
        FriendsEntity,
        DevicesEntity
      ])
  ],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UsersService,
    MailService,
    FileService,
    TokenService,
    RecordsService,
    SubScribeService,
  ],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer
      .apply(JwtMiddleware)
      .exclude(
        {
          path: 'refresh',
          method: RequestMethod.PUT,
        },
        {
          path: 'login',
          method: RequestMethod.POST,
        },
        {
          path: 'register',
          method: RequestMethod.POST,
        },
        {
          path: 'forgot-password',
          method: RequestMethod.GET,
        },
        {
          path: 'forgot-password',
          method: RequestMethod.POST,
        },
        {
          path: 'recover?token=(.*)',
          method: RequestMethod.GET,
        },
        {
          path: 'recover?token=(.*)',
          method: RequestMethod.POST,
        },
        {
          path: 'files/(.*)',
          method: RequestMethod.GET,
        },
        {
          path: 'img/(.*)',
          method: RequestMethod.GET,
        },
        {
          path: 'subscribe',
          method: RequestMethod.POST,
        },
        {
          path: 'getsubscribecount',
          method: RequestMethod.GET,
        },
        {
          path: 'gettotalrecord',
          method: RequestMethod.GET,
        },
        {
          path: 'getrecordseconds',
          method: RequestMethod.GET,
        },
        {
          path: 'getmfpercent',
          method: RequestMethod.GET,
        },
        {
          path: 'getaverage',
          method: RequestMethod.GET,
        },
        {
          path: 'gettotalinteractions',
          method: RequestMethod.GET,
        },
        {
          path: 'gettotalfriendrequest',
          method: RequestMethod.GET,
        }
      )
      .forRoutes(
        AuthController,
        AccountController,
        UsersController,
        ActionsController,
        FilesController,
        RecordsController,
        NotificationsController
      );
    consumer
      .apply(LocalMiddleware)
      .exclude(
        {
          path: 'refresh',
          method: RequestMethod.PUT,
        },
        {
          path: 'register',
          method: RequestMethod.POST,
        },
        {
          path: 'forgot-password',
          method: RequestMethod.GET,
        },
        {
          path: 'forgot-password',
          method: RequestMethod.POST,
        },
        {
          path: 'recover?token=(.*)',
          method: RequestMethod.GET,
        },
        {
          path: 'recover?token=(.*)',
          method: RequestMethod.POST,
        },
        {
          path: 'logout-everywhere',
          method: RequestMethod.POST,
        },
        {
          path: 'logout',
          method: RequestMethod.POST,
        },
        {
          path: 'subscribe',
          method: RequestMethod.POST,
        },
        {
          path: 'getsubscribecount',
          method: RequestMethod.GET,
        },
        {
          path: 'gettotalrecord',
          method: RequestMethod.GET,
        },
        {
          path: 'getrecordseconds',
          method: RequestMethod.GET,
        },
        {
          path: 'getmfpercent',
          method: RequestMethod.GET,
        },
        {
          path: 'getaverage',
          method: RequestMethod.GET,
        },
        {
          path: 'gettotalinteractions',
          method: RequestMethod.GET,
        },
        {
          path: 'gettotalfriendrequest',
          method: RequestMethod.GET,
        }
      )
      .forRoutes(AuthController);
  }
}
