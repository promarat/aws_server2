import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';

@Injectable()
export class AdminMiddleware implements NestMiddleware {
  use(req, res, next): any {
    passport.authenticate('local', { session: false }, (err, admin, info) => {
      if (typeof info !== 'undefined' || err) {
        next(new UnauthorizedException(info?.message || err));
      } else {
        req.admin = admin;
        next();
      }
    })(req, res, next);
  }
}
