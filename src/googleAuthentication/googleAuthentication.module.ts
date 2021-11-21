import { Module } from '@nestjs/common';
import { GoogleAuthenticationController } from './googleAuthentication.controller';
import { GoogleAuthenticationService } from './googleAuthentication.service';
import { ConfigModule, ConfigService } from 'nestjs-config';
import { UsersModule } from '../users/users.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [
    ConfigModule, UsersModule, AuthModule
  ],
  providers: [GoogleAuthenticationService],
  controllers: [GoogleAuthenticationController],
})
export class GoogleAuthenticationModule {}
