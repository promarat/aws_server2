import { Strategy } from 'passport-local';
import * as passport from 'passport';
import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';
import { AdminService } from './../../admin/admin.service';

@Injectable()
export class AdminStrategy extends Strategy {
  constructor(private readonly adminService: AdminService) {
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
    const findUser = await this.adminService.findOneByEmail(email);
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
