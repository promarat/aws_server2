import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { UsersService } from "../users/users.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { LoginResponse } from "./dto/login.response";
import { TokenService } from "./token/token.service";
import { PasswordResetEntity } from "../entities/reset-password.entity";
import { GeneratorUtil } from "../lib/generator-util";
import { UsersEntity } from "../entities/users.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private tokenService: TokenService,
    @InjectRepository(PasswordResetEntity) private passwordResetRepository: Repository<PasswordResetEntity>
  ) {
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
    newUser.updatedAt = new Date();
    const createUser = await this.usersService.createUser(newUser)
    return this.login(credentials, ip, createUser)
  }

  async login(credentials, ipAddress: string, user): Promise<LoginResponse> {
    const payload: any = {
      username: user.username,
      sub: user.id,
    };
    const loginResponse: LoginResponse = await this.tokenService.createAccessToken(payload);
    const tokenContent = { userId: user.id, ipAddress };
    const refresh = await this.tokenService.createRefreshToken(tokenContent);
    loginResponse.refreshToken = refresh;
    await this.usersService.updateActivity(user.id);
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
}
