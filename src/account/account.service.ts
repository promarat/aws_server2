import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { CompleteRegisterDto } from "./dto/complete-register.dto";
import { RecordsService } from "../records/records.service";
import { FileService } from "../files/file.service";
import { FileTypeEnum } from "../lib/enum";
import { GenderEnum } from "../lib/enum";
import { EmailVerify } from "./dto/emailverify.dto";
import { find } from "rxjs";
import { UsersEntity } from "src/entities/users.entity";
import { GeneratorUtil } from "../lib/generator-util";
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AccountService {
  constructor(
    private usersService: UsersService,
    private recordsService: RecordsService,
    private fileService: FileService
  ) {
  }

  async getAccountData(user) {
    const userDataQuery = this.usersService.findById(user.id);
    const limitsQuery = this.recordsService.getTodayCount(user);
    const [userData, limitData] = await Promise.all([userDataQuery, limitsQuery]);
    return { ...userData, ...limitData };
  }

  async updateProfile(user: UsersEntity, body: CompleteRegisterDto) {
    const findUser = await this.usersService.findById(user.id);
    // findUser.pseudo = body.pseudo;
    findUser.dob = body.dob;
    findUser.updatedAt = new Date();
    findUser.country = body.country;
    findUser.gender = <GenderEnum>body.gender;
    findUser.name = body.name;
    findUser.isProfileCompleted = true;
    return this.usersService.completeRegister(findUser);
  }

  async addAvatar(userId: string, imageBuffer: Buffer, filename: string) {
    const findUser = await this.usersService.getById(userId);
    const avatar = await this.fileService.uploadFile(imageBuffer, filename, FileTypeEnum.IMAGE);
    await this.usersService.updateAvatar(userId, {
      ...findUser,
      avatar
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

  async resetpassword(user, oldpassword, newpassword) {
    const findUser = await this.usersService.findById(user.id);
    console.log("reset password--", oldpassword, newpassword, findUser, await GeneratorUtil.generateHash(oldpassword));
    const valid = await bcrypt.compare(oldpassword, findUser.password);
    if (!valid) {
      throw new BadRequestException("incorrect old password");
    }

    findUser.password = await GeneratorUtil.generateHash(newpassword);
    return this.usersService.completeRegister(findUser);
  }
}
