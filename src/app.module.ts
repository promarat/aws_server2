import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from "nestjs-config";
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import * as path from 'path';
import { TypeOrmModule, TypeOrmModuleOptions } from "@nestjs/typeorm";
import { FileModule } from './files/files.module';
import { AccountModule } from './account/account.module';
import { RecordsModule } from './records/records.module';
import { FriendsModule } from './friends/friends.module';
import { ActionsModule } from './actions/actions.module';
import { NotificationsModule } from './notifications/notifications.module';
@Module({
  imports: [
    ConfigModule.load(path.resolve(__dirname, 'config', '**/!(*.d).{ts,js}')),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => {
        const config: TypeOrmModuleOptions = {
          type: 'postgres',
          host: configService.get('database.database_address'),
          port: configService.get('database.database_port'),
          username: configService.get('database.database_login'),
          password: configService.get('database.database_password'),
          database: configService.get('database.database_name'),
          extra: {
            charset: "utf8mb4_unicode_ci"
          },
          entities: [__dirname + "/entities/*.entity{.ts,.js}"],
          migrations: [__dirname + "/migrations/*.{.ts,.js}"],
          synchronize: true,
          logging: true
        };
        console.log(config)
        return config
      },
      inject: [ConfigService],
    }),
    // TypeOrmModule.forRootAsync({
    //   useFactory: (configService: ConfigService) => configService.get('database'),
    //   inject: [ConfigService],
    // }),
    AuthModule,
    FileModule,
    UsersModule,
    MailModule,
    AccountModule,
    RecordsModule,
    FriendsModule,
    ActionsModule,
    NotificationsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
