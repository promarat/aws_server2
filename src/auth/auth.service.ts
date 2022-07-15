import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";
import { UsersService } from "../users/users.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoginResponse } from "./dto/login.response";
import { TokenService } from "./token/token.service";
import { PasswordResetEntity } from "../entities/reset-password.entity";
import { GeneratorUtil } from "../lib/generator-util";
import { UsersEntity } from "../entities/users.entity";
import { MailsService } from "../mail/mail.service";
import { map } from "rxjs/operators";
import { GenderEnum } from "src/lib/enum";
import { PremiumEnum } from "src/lib/enum";
import { Twilio } from 'twilio';
import { ConfigService } from "nestjs-config";

@Injectable()
export class AuthService {
  private twilioClient: Twilio;
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    private mailService: MailsService,
    private httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRepository(PasswordResetEntity) private passwordResetRepository: Repository<PasswordResetEntity>
  ) {
    const accountSid = this.configService.get('app.twilio_account_sid');
    const authToken = this.configService.get('app.twilio_auth_token');
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async register(credentials, ip) {
    const existUser = await this.usersService.findOneByEmail(credentials.email);
    if (existUser) {
      throw new BadRequestException("User with current email already registered");
    }
    const newUser = new UsersEntity();
    newUser.password = await GeneratorUtil.generateHash(credentials.password);
    newUser.email = credentials.email;
    newUser.createdAt = new Date();
    newUser.isActive = true;
    newUser.isEmailVerified = false;
    newUser.pseudo = (Math.floor(Math.random() * 100000) + 100000) + "";
    const createUser = await this.usersService.createUser(newUser)

    this.mailService.sentVerificationCode(newUser.pseudo, newUser.email);
    return this.login(ip, createUser)
  }

  async phoneRegister(phoneNumber: string) {
    const existUser = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (existUser) {
      throw new BadRequestException("User with current phone number already registered");
    }
    const serviceSid = this.configService.get('app.twilio_server_sid');
    return this.twilioClient.verify.services(serviceSid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' })
  }

  async phoneLogin(phoneNumber: string) {
    const existUser = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (!existUser) {
      throw new BadRequestException("User with current phone number not found");
    }
    const serviceSid = this.configService.get('app.twilio_server_sid');
    return this.twilioClient.verify.services(serviceSid)
      .verifications
      .create({ to: phoneNumber, channel: 'sms' })
  }

  async confirmPhoneNumber(phoneNumber: string, verificationCode: string) {
    const serviceSid = this.configService.get('app.twilio_server_sid');
    const result = await this.twilioClient.verify.services(serviceSid)
      .verificationChecks
      .create({ to: phoneNumber, code: verificationCode })
    if (!result.valid || result.status !== 'approved') {
      throw new BadRequestException('Wrong code provided');
    }
    const existUser = await this.usersService.findOneByPhoneNumber(phoneNumber);
    if (!existUser) {
      const newUser = new UsersEntity();
      newUser.phoneNumber = phoneNumber;
      newUser.createdAt = new Date();
      newUser.isActive = true;
      const createUser = await this.usersService.createUser(newUser);
      return this.login("", createUser, true);
    }
    else
      return this.login("", existUser, false);
  }

  async addSession(info) {
    this.usersService.addSession(info);
  }

  // async verifyToken(credentials) {
  //   const existUser = await this.usersService.findOneByEmail(credentials.email);
  //   if (existUser) {
  //     throw new BadRequestException("User with current email already registered");
  //   }
  //   const newUser = new UsersEntity();
  //   newUser.password = await GeneratorUtil.generateHash(credentials.password);
  //   newUser.email = credentials.email;
  //   newUser.createdAt = new Date();
  //   newUser.isActive = true;
  //   newUser.isEmailVerified = false;
  //   newUser.updatedAt = new Date();
  //   newUser.pseudo = (Math.floor(Math.random() * 100000) + 100000) + "";
  //   const createUser = await this.usersService.createUser(newUser)

  //   this.mailService.sentVerificationCode(newUser.pseudo, newUser.email);
  //   return this.login(credentials, ip, createUser)
  // } 

  async registerWithGoogle(email: string) {
    const existUser = await this.usersService.findOneByEmail(email);
    if (existUser) {
      throw new BadRequestException("User with current email already registered");
    }

    const newUser = new UsersEntity();
    // newUser.password = await GeneratorUtil.generateHash(credentials.password);
    newUser.email = email;
    newUser.createdAt = new Date();
    newUser.isActive = true;
    newUser.isEmailVerified = true;
    newUser.updatedAt = new Date();
    newUser.isRegisteredWithGoogle = true;
    newUser.pseudo = (Math.floor(Math.random() * 100000) + 100000) + "";
    const createUser = await this.usersService.createUser(newUser)

    return createUser;
  }

  async login(ipAddress: string, user, isRegister: boolean = false): Promise<LoginResponse> {
    const payload: any = {
      username: user.username,
      sub: user.id,
    };
    const loginResponse: LoginResponse = await this.tokenService.createAccessToken(payload);
    const tokenContent = { userId: user.id, ipAddress };
    const refresh = await this.tokenService.createRefreshToken(tokenContent);
    loginResponse.refreshToken = refresh;
    await this.usersService.updateActivity(user.id);
    loginResponse.isRegister = isRegister;
    return loginResponse;
  }

  logout(userId: string, refreshToken: string): Promise<any> {
    return this.tokenService.deleteRefreshToken(userId, refreshToken);
  }

  logoutFromAll(userId: string): Promise<any> {
    return this.tokenService.deleteRefreshTokenForUser(userId);
  }

  /* recover password */
  async findRecoverRecord(email) {
    return await this.passwordResetRepository.findOne({ where: email });
  }

  async recoverPassword(email) {
    const existUser = await this.usersService.findOneByEmail(email);
    return await this.recoverData(existUser.id);
  }

  async updateRecoverRecord(resRecord) {
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() + 24);
    const recoverData = new PasswordResetEntity();
    recoverData.token = await GeneratorUtil.generateRandomCode(32);
    recoverData.expiredAt = expiredDate;
    return await this.passwordResetRepository.update(resRecord.id, recoverData);
  }

  async recoverData(email) {
    const existUser = await this.usersService.findOneByEmail(email);
    if (!existUser) {
      throw new NotFoundException();
    }
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() + 24);
    const recoverData = new PasswordResetEntity();
    recoverData.userId = existUser.id;
    recoverData.token = await GeneratorUtil.generateRandomCode(32);
    recoverData.expiredAt = expiredDate;
    return await this.passwordResetRepository.save(recoverData);
  }

  async validateToken(token) {
    const findToken = await this.passwordResetRepository.findOne({ where: { token } });
    if (findToken) {
      const currentDate = new Date();
      const expiredDate = findToken.expiredAt;
      if (currentDate <= expiredDate) {
        return findToken;
      } else {
        await this.passwordResetRepository.delete(findToken.id);
        throw new BadRequestException("Recover code date expired");
      }
    }
  }

  async getRecoverData(id: string) {
    return await this.usersService.findByIdRecover(id);
  }

  async updateUserPassword(request, id) {
    return await this.usersService.updatePassword(request, id);
  }

  async deleteRecoverRecord(id: string) {
    return await this.passwordResetRepository.delete(id);
  }

  async generateRandomeUsers(count) {
    const countryArray = ["France", "Spain", "Canada", "United States", "Belgium", "Germany", "United Kingdom", "Finland"];
    const premiumArray = ["none", "monthly", "yearly"]
    for (var i = 0; i < count; i++) {

      const { data: cUser } = await this.httpService.get('https://random-data-api.com/api/users/random_user').toPromise();

      const existUser = await this.usersService.findOneByEmail(cUser.email);
      if (existUser) {
        throw new BadRequestException("User with current email already registered");
      }
      const newUser = new UsersEntity();
      newUser.password = await GeneratorUtil.generateHash(cUser.password);
      newUser.email = cUser.email;
      const today = new Date();
      const cDate = new Date(today);
      const rndDay = Math.floor(Math.random() * 15) + 1;
      cDate.setDate(cDate.getDate() - rndDay);
      newUser.createdAt = cDate;
      newUser.isActive = true;
      newUser.isEmailVerified = true;
      newUser.updatedAt = today;
      newUser.name = cUser.username
      newUser.firstname = cUser.first_name;
      newUser.lastname = cUser.last_name;
      newUser.dob = cUser.date_of_birth;
      newUser.isProfileCompleted = true;
      newUser.premium = <PremiumEnum>premiumArray[Math.floor(Math.random() * 3)];
      if (i <= Math.round(count * 55 / 100)) {
        newUser.gender = <GenderEnum>"m";
      } else {
        newUser.gender = <GenderEnum>"f";
      }
      newUser.country = countryArray[Math.floor(Math.random() * 4)]
      newUser.pseudo = (Math.floor(Math.random() * 100000) + 100000) + "";
      const createUser = await this.usersService.createUser(newUser);

    }

  }

}
