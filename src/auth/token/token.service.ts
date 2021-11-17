import {Injectable, Logger, NotFoundException, UnauthorizedException} from "@nestjs/common";
import { randomBytes } from "crypto";
import { sign, SignOptions, verify } from "jsonwebtoken";
import * as moment from "moment";
import { v4 as uuidv4 } from "uuid";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { UsersService } from "../../users/users.service";
import { RefreshTokenEntity } from "../../entities/token.entity";
import { ConfigService } from "nestjs-config";

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);
  private readonly jwtOptions: SignOptions;
  private readonly jwtKey: string;
  private refreshTokenTtl: number;
  private readonly expiresInDefault: string | number;

  private readonly usersExpired: number[] = [];

  constructor(
    @InjectRepository(RefreshTokenEntity) private tokenRepository: Repository<RefreshTokenEntity>,
    private usersService: UsersService
  ) {
    this.expiresInDefault = parseInt(ConfigService.get('app.access_token_ttl'), 10) || 60 * 5;
    this.jwtOptions = { expiresIn: this.expiresInDefault };
    this.jwtKey = ConfigService.get('app.token_secret') || "DEMO_KEY";
    this.refreshTokenTtl = parseInt(ConfigService.get('app.token_secret'), 10) || 30; // 30 Days
  }

  async getAccessTokenFromRefreshToken(reqRefreshToken: string, oldAccessToken: string, ipAddress: string): Promise<any> {
    try {
      const token = await this.tokenRepository.findOne({ where: { value: reqRefreshToken, ipAddress: ipAddress } });
      const currentDate = new Date();
      if (!token) {
        throw new NotFoundException("Refresh token not found");
      }
      if (token.expiresAt < currentDate) {
        await this.deleteRefreshToken(token.userId, token.value)
        throw new UnauthorizedException('Refresh token expired');
      }
      const oldPayload = await this.validateToken(oldAccessToken, true);
      const userData = await this.usersService.findOneByIdForPayload(oldPayload.sub);
      const payload = {
        pseudo: userData.pseudo,
        sub: userData.id,
        email: userData.email
      };
      const newAccessToken = await this.createAccessToken(payload);
      await this.tokenRepository.delete(token.id);
      const refreshToken = await this.createRefreshToken({ userId: oldPayload.sub, ipAddress });
      return {
        accessToken: newAccessToken.accessToken,
        expiresIn: newAccessToken.expiresIn,
        refreshToken: refreshToken
      };
    } catch (error) {
      this.logger.error(error);
      throw error;
    }
  }

  async createAccessToken(payload: any, expires = this.expiresInDefault): Promise<any> {
    const options = this.jwtOptions;
    expires > 0 ? (options.expiresIn = expires) : delete options.expiresIn;
    options.jwtid = uuidv4();
    const signedPayload = sign(payload, this.jwtKey, options);
    const token: any = {
      id: payload.sub,
      pseudo: payload.pseudo,
      accessToken: signedPayload,
      expiresIn: expires
    };
    return token;
  }

  async createRefreshToken(tokenContent: { userId: string; ipAddress: string; }): Promise<string> {
    const { userId, ipAddress } = tokenContent;
    await this.removeExpiresTokens();
    const findUserSessionsByIp = await this.tokenRepository.createQueryBuilder("tokens")
      .select()
      .where({ userId: userId, ipAddress: ipAddress })
      .orderBy("tokens.expiresAt", "ASC")
      .getMany();
    const token = new RefreshTokenEntity();
    const refreshToken = randomBytes(64).toString("hex");
    token.userId = userId;
    token.value = refreshToken;
    token.ipAddress = ipAddress;
    token.expiresAt = moment().add(this.refreshTokenTtl, "d").toDate();
    if (findUserSessionsByIp.length < 5) {
      await this.tokenRepository.save(token);
      return refreshToken;
    } else {
      const olderActiveSession = findUserSessionsByIp[0];
      await this.tokenRepository.update(olderActiveSession.id, token);
      return refreshToken;
    }
  }

  async removeExpiresTokens() {
    const currentDate = new Date();
    await this.tokenRepository.createQueryBuilder()
      .createQueryBuilder()
      .delete()
      .from(RefreshTokenEntity)
      .where(":currentDate >= expiresAt", { currentDate })
      .execute();
  }

  async deleteRefreshTokenForUser(userId: string) {
    await this.tokenRepository.delete({ userId: userId });
    return await this.revokeTokenForUser(userId);
  }

  async deleteRefreshToken(userId: string, value: string) {
    await this.tokenRepository.delete({ value });
    return await this.revokeTokenForUser(userId);
  }

  async validatePayload(payload): Promise<any> {
    const tokenBlacklisted = await this.isBlackListed(payload.sub, payload.exp);
    if (!tokenBlacklisted) {
      return {
        id: payload.sub,
        pseudo: payload.pseudo,
      };
    }
    return null;
  }

  private async validateToken(token: string, ignoreExpiration: boolean = false): Promise<any> {
    // return verify(token, this.jwtKey, { ignoreExpiration }) as JwtPayload;
    return verify(token, this.jwtKey, { ignoreExpiration });
  }

  private async isBlackListed(id: string, expire: number): Promise<boolean> {
    return this.usersExpired[id] && expire < this.usersExpired[id];
  }

  private async revokeTokenForUser(userId: string): Promise<any> {
    return this.usersExpired[userId] = moment().add(this.expiresInDefault, "s").unix();
  }
}
