import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Put,
  Query,
  Req,
  Res,
  Headers
} from "@nestjs/common";
import { ExtractJwt } from "passport-jwt";
import { AuthService } from "./auth.service";
import { MailService } from "../mail/mail.service";
import { TokenService } from "./token/token.service";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { ForgotPassRequest } from "./dto/forgot-pass.request";
import { RecoverRequest, ResetRequest } from "./dto/recover.request";
import { LoginResponse } from "./dto/login.response";
import { LoginRequest } from "./dto/login.request";
import { SubScribeRequest } from "./dto/subscribe.request";
import { SubScribeService } from "./subscripbe/subscribe.service"

@Controller()
@ApiTags("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private mailService: MailService,
    private tokenService: TokenService,
    private subScribeService: SubScribeService
  ) {
  }

  @Post("register")
  @ApiResponse({ status: HttpStatus.CREATED, description: "User data with jwt token", type: LoginResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async register(
    @Req() req,
    @Res() res,
    @Body() loginReq: LoginRequest
  ): Promise<LoginResponse> {
    const reqIp = ""; //req.headers["x-real-ip"] || req.connection.remoteAddress;
    return await this.authService.register(loginReq, reqIp)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("login")
  @ApiResponse({ status: HttpStatus.CREATED, description: "User data with jwt token", type: LoginResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async login(
    @Req() req,
    @Res() res,
    @Body() loginReq: LoginRequest
  ): Promise<LoginResponse> {
    const reqIp = '';//req.headers["x-real-ip"] || req.connection.remoteAddress;
    const user = req.user;
    return await this.authService.login(loginReq, reqIp, user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Put("refresh")
  @ApiBearerAuth()
  @ApiResponse({ status: HttpStatus.CREATED, description: "User data with jwt token", type: LoginResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  @ApiHeader({ name: "refresh-token", required: true })
  @ApiOperation({ description: "Get a refresh token" })
  async token(
    @Headers("refresh-token") refreshToken: string,
    @Req() req,
    @Res() res
  ): Promise<LoginResponse> {
    const reqIp = ""; //req.headers["x-real-ip"] || req.connection.remoteAddress;
    const oldAccessToken = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    console.log("refresh-- oldAccessToken", oldAccessToken);
    return await this.tokenService.getAccessTokenFromRefreshToken(refreshToken, oldAccessToken, reqIp)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }


  @Post("forgot-password")
  @ApiResponse({ status: HttpStatus.OK, description: "Recovery message has been sent" })
  async recoverPass(
    @Res() res,
    @Body() request: ForgotPassRequest,
    @Query("resent") resent
  ) {
    const isSent = await this.authService.findRecoverRecord(request.email);
    if (!isSent) {
      return this.authService.recoverData(request.email)
        .then((recoverData) => this.mailService.sentRecoverCode(recoverData.token, request.email))
        .then(() => res.status(HttpStatus.OK).send({ message: "Recovery message has been sent" }))
        .catch((error) => res.status(error.statusCode).send(error.response));
    }
    if (isSent && resent) {
      return this.authService.updateRecoverRecord(isSent)
        .then(() => res.status(HttpStatus.OK).send({ message: "Recovery message has been re-sent" }))
        .catch((error) => res.status(error.statusCode).send(error.response));
    } else {
      return res.status(HttpStatus.BAD_REQUEST).send({ message: "Recovery message was already sent" });
    }
  }

  @Get("recover")
  @ApiQuery({ name: "token", type: String, required: true })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Wrong token" })
  @ApiResponse({ status: HttpStatus.OK, description: "User data", type: RecoverRequest })
  @ApiOperation({ summary: "public endpoint" })
  async getRecoverData(
    @Res() res,
    @Query("token") token: string
  ) {
    const checkToken = await this.authService.validateToken(token);
    if (!checkToken) {
      throw new BadRequestException("Wrong token");
    }
    return this.authService.getRecoverData(checkToken.userId)
      .then((token) => res.json(token))
      .catch((error) => res.status(error.statusCode).send(error.response));
  }

  @Post("resetpassword")
  @ApiQuery({ name: "token", type: String, required: true })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: "Wrong token" })
  @ApiResponse({ status: HttpStatus.OK, description: "Password was changed" })
  async updateUserPassword(
    @Res() res,
    @Query("token") token: string,
    @Body() request: ResetRequest
  ) {
    const checkToken = await this.authService.validateToken(token);
    if (!checkToken) {
      throw new BadRequestException("Wrong token");
    }
    return await this.authService.updateUserPassword(request, checkToken.userId)
      .then(() => this.authService.deleteRecoverRecord(checkToken.id))
      .then(() => res.status(HttpStatus.OK).send("Password was changed"))
      .catch((error) => res.status(error.statusCode).send(error.response));
  }

  @Post("logout")
  @ApiHeader({ name: "refresh-token", required: true })
  @ApiBearerAuth()
  logout(
    @Res() res,
    @Headers("refresh-token") refreshToken: string,
    @Req() req
  ) {
    const user = req.user;
    return this.authService.logout(user, refreshToken)
      .then(() => res.status(HttpStatus.NO_CONTENT).send("ok"))
      .catch((error) => res.status(error.statusCode).send(error.response));
  }

  @Post("logout-everywhere")
  @ApiBearerAuth()
  async logoutEverywhere(
    @Res() res,
    @Req() req
  ) {
    const user = req.user;
    return this.authService.logoutFromAll(user.id)
      .then(() => res.status(HttpStatus.NO_CONTENT).send("ok"))
      .catch((error) => res.status(error.statusCode).send(error.response));
  }

  @Post("subscribe")
  @ApiResponse({ status: HttpStatus.CREATED, description: "The Email has been subscribed", type: SubScribeRequest })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async addSubScribe(
    @Res() res,
    @Body() requestbody: SubScribeRequest,
  ): Promise<SubScribeRequest> {
    return await this.subScribeService.addSubScribe(requestbody)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
}
