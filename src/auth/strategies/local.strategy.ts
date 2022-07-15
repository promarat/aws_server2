import { Strategy } from 'passport-local';
import { UsersService } from '../../users/users.service';
import { AdminService } from 'src/admin/admin.service';
import * as passport from 'passport';
import * as bcrypt from 'bcryptjs';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LocalStrategy extends Strategy {
  constructor(
    private readonly usersService: UsersService,
    private readonly adminService: AdminService
  ) {
    super(
      {
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true
      },
      async (req, email, password, done) => {
        const isAdmin = req.body.isAdmin;
        if (isAdmin){
          await this.adminLogIn(email, password, done)
        } else {
          await this.logIn(email, password, done)
        }
      },
    );
    passport.use(this as Strategy);
  }

  async adminLogIn(email, password, done) {
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
