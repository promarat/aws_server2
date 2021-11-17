import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import * as passport from 'passport';


@Injectable()
export class JwtMiddleware implements NestMiddleware {
  use(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (typeof info !== 'undefined') {
        next(new UnauthorizedException(info.message));
      } else if (err) {
        next(err);
      } else {
        // add user to request object
        req.user = user;
        next();
      }
    })(req, res, next);
  }
}