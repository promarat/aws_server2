import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { TokenService } from "../token/token.service";
import { ConfigService } from "nestjs-config";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly tokenService: TokenService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      passReqToCallback: false,
      secretOrKey: ConfigService.get('app.token_secret'),
    });
  }

  async validate(payload: any) {
    const result = await this.tokenService.validatePayload(payload);
    if (!result) {
      throw new UnauthorizedException();
    }
    return result;
  }
}