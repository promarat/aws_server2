import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { CompleteRegisterDto } from "./dto/complete-register.dto";
import { RecordsService } from "../records/records.service";
import { PremiumEnum } from "../lib/enum";
import { FileService } from "../files/file.service";
import { FileTypeEnum } from "../lib/enum";
import { GenderEnum } from "../lib/enum";
import { EmailVerify, UsernameVerifyResponse } from "./dto/emailverify.dto";
import { ConnectableObservable, find } from "rxjs";
import { UsersEntity } from "src/entities/users.entity";
import { GeneratorUtil } from "../lib/generator-util";
import * as bcrypt from 'bcryptjs';
import { MailsService } from "src/mail/mail.service";

@Injectable()
export class AccountService {
  constructor(
    private usersService: UsersService,
    private recordsService: RecordsService,
    private fileService: FileService,
    private mailService: MailsService
  ) {
  }

  async getAccountData(user, checkDevice, deviceToken, deviceOs) {
    this.usersService.addOpenApp(user);
    if(checkDevice == 'reg'){
      return await this.usersService.deviceRegister(user,deviceToken, deviceOs).then (async res=>{
        const userData = await this.usersService.findById(user.id);
        if( userData ){
          const limitData = await this.recordsService.getTodayCount(user);
    //      const [userData, limitData] = await Promise.all([userDataQuery, limitsQuery]);
          return { ...userData, ...limitData };
        }
        else
          return null;
        }
        )
    }
    else{
      const userData = await this.usersService.findById(user.id);
      if(userData){
        const limitsData = this.recordsService.getTodayCount(user);
 //       const [userData, limitData] = await Promise.all([userDataQuery, limitsQuery]);
        return { ...userData, ...limitsData };
      }
      else
        return null;
    }
  }
  
  async resendCode(user) {
    const userData =  await this.usersService.findById(user.id);
    this.mailService.sentVerificationCode(userData.pseudo, userData.email);
    return true;
  }

  async updateProfile(user: UsersEntity, body: CompleteRegisterDto) {
    const findUser = await this.usersService.findById(user.id);
    // findUser.pseudo = body.pseudo;
    findUser.dob = body.dob;
    findUser.bio = body.bio;
    findUser.updatedAt = new Date();
    findUser.country = body.country;
    findUser.gender = <GenderEnum>body.gender;
    findUser.name = body.name;
    findUser.isProfileCompleted = true;
    findUser.firstname = body.first;
    findUser.lastname = body.last;
    findUser.isPrivate = body.isPrivate == "true" ? true : false;
    return this.usersService.completeRegister(findUser);
  }

  async addAvatar(userId: string, imageBuffer: Buffer, filename: string, avatarNumber: number) {
    const findUser = await this.usersService.getById(userId);
    const avatar = imageBuffer?await this.fileService.uploadFile(imageBuffer, filename, FileTypeEnum.IMAGE):null;
    await this.usersService.updateAvatar(userId, {
      ...findUser,
      avatar,
      avatarNumber
    });
    return avatar;
  }

  async emailVerify(user, body: EmailVerify) {
    const findUser = await this.usersService.findById(user.id);
    if (findUser.pseudo == body.pseudo){
      findUser.isEmailVerified = true;
      return this.usersService.completeRegister(findUser);
    }
    else
      throw new BadRequestException("Email Verify Faild");
  }

  async changePremium(user, premium_state){
    const findUser = await this.usersService.findById(user.id);
    findUser.premium = <PremiumEnum>premium_state;
    return this.usersService.completeRegister(findUser);
  }

  async resetpassword(user, oldpassword, newpassword) {
    const findUser = await this.usersService.findById(user.id);
    const valid = await bcrypt.compare(oldpassword, findUser.password);
    if (!valid) {
      throw new BadRequestException("incorrect old password");
    }

    findUser.password = await GeneratorUtil.generateHash(newpassword);
    return this.usersService.completeRegister(findUser);
  }

  async changeEmail(user, password, newemail) {
    const findUser = await this.usersService.findById(user.id);
    const valid = await bcrypt.compare(password, findUser.password);
    if (!valid) {
      throw new BadRequestException("incorrect password");
    }

    findUser.newpseudo = (Math.floor(Math.random() * 100000) + 100000) + "";
    findUser.newemail = newemail;
    
    this.mailService.sentVerificationCode(findUser.newpseudo, newemail);

    return this.usersService.completeRegister(findUser);
  }

  async changeEmailVerify(user, pseudo) {
    const findUser = await this.usersService.findById(user.id);
    if (findUser.newpseudo == pseudo){
      findUser.email = findUser.newemail;
      return this.usersService.completeRegister(findUser);
    }
    else
      throw new BadRequestException("NewEmail Verify Faild");
  }

  async usernameVerify(user, username) {
    const findUser = await this.usersService.findByName(user.id, username);
    if (findUser && findUser.length > 0) {
      throw new BadRequestException("username is already taken");
    }
    else{
      const payload: any = {
        resp: 'OK',
      };
      return payload;
    }
  }

  async deleteAccount(user) {
    return await this.usersService.deleteUser(user);
  }
}
