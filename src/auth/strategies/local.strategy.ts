import { Strategy } from 'passport-local';
import { UsersService } from '../../users/users.service';
import * as passport from 'passport';
import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends Strategy {
  constructor(private readonly usersService: UsersService) {
    super(
      {
        usernameField: 'email',
        passReqToCallback: false,
      },
      async (email, password, done) => await this.logIn(email, password, done),
    );
    passport.use(this as Strategy);
  }


  async logIn(email, password, done) {
    const findUser = await this.usersService.findOneByEmail(email);
    if (!findUser) {
      return done('User not found', null);
    }

    const valid = await bcrypt.compare(password, findUser.password);
    if (!valid) {
      return done('Wrong password', null);
    }

    return done(null, findUser);
  }

}
