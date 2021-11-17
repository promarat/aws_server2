import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';

@Injectable()
export class LocalMiddleware implements NestMiddleware {
  use(req, res, next): any {
    passport.authenticate('local', { session: false }, (err, user, info) => {
      if (typeof info !== 'undefined' || err) {
        next(new UnauthorizedException(info?.message || err));
      } else {
        req.user = user;
        next();
      }
    })(req, res, next);
  }
}
