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
  Headers,
} from "@nestjs/common";
import { ExtractJwt } from "passport-jwt";
import { AuthService } from "./auth.service";
import { MailsService } from "../mail/mail.service";
import { TokenService } from "./token/token.service";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags, ApiUnauthorizedResponse } from "@nestjs/swagger";
import { ForgotPassRequest } from "./dto/forgot-pass.request";
import { RecoverRequest, ResetRequest } from "./dto/recover.request";
import { LoginResponse } from "./dto/login.response";
import { LoginRequest } from "./dto/login.request";
import { AdminLoginRequest, AdminLoginResponse } from "../admin/dto/admin.response";
import { SubScribeRequest } from "./dto/subscribe.request";
import { SubScribeService } from "./subscripbe/subscribe.service"
import { RecordsService } from "src/records/records.service";
import { UsersService } from "../users/users.service";
import { AdminService } from "../admin/admin.service";
import { SessionRequest } from "./dto/session.request";

@Controller()
@ApiTags("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private mailService: MailsService,
    private tokenService: TokenService,
    private subScribeService: SubScribeService,
    private recordsService: RecordsService,
    private usersService: UsersService,
    private adminService: AdminService
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

  @Post("phoneRegister")
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async phoneRegister(
    @Req() req,
    @Res() res,
    @Body() body: LoginRequest
  ): Promise<LoginResponse> {
    const reqIp = ""; //req.headers["x-real-ip"] || req.connection.remoteAddress;
    return await this.authService.phoneRegister(body.phoneNumber)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("phoneLogin")
  @ApiResponse({ status: HttpStatus.CREATED })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async phoneLogin(
    @Req() req,
    @Res() res,
    @Body() body: LoginRequest
  ): Promise<LoginResponse> {
    const reqIp = ""; //req.headers["x-real-ip"] || req.connection.remoteAddress;
    return await this.authService.phoneLogin(body.phoneNumber)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("confirmPhoneNumber")
  @ApiResponse({ status: HttpStatus.CREATED, description: "User data with jwt token", type: LoginResponse })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  async confirm(
    @Req() req,
    @Res() res,
    @Body() body: LoginRequest
  ): Promise<LoginResponse> {
    const reqIp = ""; //req.headers["x-real-ip"] || req.connection.remoteAddress;
    return await this.authService.confirmPhoneNumber(body.phoneNumber, body.verificationCode)
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
    return await this.authService.login(reqIp, user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("session")
  @ApiResponse({ status: HttpStatus.CREATED})
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED})
  async addSession(
    @Req() req,
    @Res() res,
    @Body() sessionReq: SessionRequest
  ): Promise<LoginResponse> {
    return await this.authService.addSession(sessionReq)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  // @Post("token_verify")
  // @ApiBearerAuth()
  // @ApiResponse({ status: HttpStatus.CREATED, description: "User data with jwt token", type: LoginResponse })
  // @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
  // @ApiHeader({ name: "api_token", required: true })
  // async tokenVerify(
  //   @Headers("api_token") apiToken: string,
  //   @Req() req,
  //   @Res() res,
  // ): Promise<LoginResponse> {
  //   const reqIp = '';//req.headers["x-real-ip"] || req.connection.remoteAddress;
  //   const decodedJwtAccessToken: JwtPayload = this.jwtService.decode(apiToken);
  //   return await this.authService.verifyToken(decodedJwtAccessToken)
  //     .then((data) => res.json(data))
  //     .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  // }

  @Post("refresh")
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

  @Get("getsubscribeusercount")
  @ApiResponse({ status: HttpStatus.OK})
  async getSubScribeUserCount(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getSubScribeUserCount()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getnewusersthisweek")
  @ApiResponse({ status: HttpStatus.OK})
  async getNewUsersThisWeek(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getNewUsersThisWeek()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getuserscountmonth")
  @ApiResponse({ status: HttpStatus.OK})
  async getUsersCountMonth(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getUsersCountMonth()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getusersdaily")
  @ApiResponse({ status: HttpStatus.OK})
  async getUsersDaily(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getUsersDaily()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getvoicebycategory")
  @ApiResponse({ status: HttpStatus.OK})
  async getVoiceByCategory(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.recordsService.getVoiceByCategory()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getpremiumusersbymonth")
  @ApiResponse({ status: HttpStatus.OK})
  async getPremiumUsersByMonth(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getPremiumUsersByMonth()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getdevicesbymonth")
  @ApiResponse({ status: HttpStatus.OK})
  async getDevicesByMonth(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getDevicesByMonth()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getlastvocals")
  @ApiResponse({ status: HttpStatus.OK})
  async getLastVocals(
    @Res() res,
  ): Promise<SubScribeRequest> {
  return await this.recordsService.getLastVocals()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getusersbycountry")
  @ApiResponse({ status: HttpStatus.OK})
  async getUsersByCountry(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getUsersByCountry()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getusersstatisticsbycountry")
  @ApiResponse({ status: HttpStatus.OK})
  async getUsersStatisticsByCountry(
    @Res() res,
  ): Promise<SubScribeRequest> {
    return await this.usersService.getUsersStatisticsByCountry()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getusers")
  @ApiResponse({ status: HttpStatus.OK})
  @ApiQuery({ name: "page", type: Number, required: true })
  @ApiQuery({ name: "items_per_page", type: Number, required: true })
  async getUsers(
    @Res() res,
    @Query("page") page: Number,
    @Query("items_per_page") itemsPerPage: Number
  ): Promise<SubScribeRequest> {
  return await this.usersService.getUsers(page, itemsPerPage)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getrecordsgbyuser")
  @ApiResponse({ status: HttpStatus.OK})
  async getRecords_ByUser(
    @Res() res,
  ): Promise<SubScribeRequest> {
  return await this.recordsService.getRecords_ByUser()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getcountries")
  @ApiResponse({ status: HttpStatus.OK})
  async getCountries(
    @Res() res,
  ): Promise<SubScribeRequest> {
  return await this.usersService.getCountries()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("gettotalrecord")
  @ApiResponse({ status: HttpStatus.OK})
  async getTotalRecord(
    @Res() res,
  ) {
    return await this.recordsService.getTotalRecord()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getrecordseconds")
  @ApiResponse({ status: HttpStatus.OK})
  async getRecordSeconds(
    @Res() res,
  ) {
    return await this.recordsService.getRecordSeconds()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getmfpercent")
  @ApiResponse({ status: HttpStatus.OK})
  async getMFPercent(
    @Res() res,
  ) {
    return await this.usersService.getMFPercent()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getaverage")
  @ApiResponse({ status: HttpStatus.OK})
  async getAverAge(
    @Res() res,
  ) {
    return await this.usersService.getAverAge()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("gettotalinteractions")
  @ApiResponse({ status: HttpStatus.OK})
  async getTotalInteractions(
    @Res() res,
  ) {
    return await this.recordsService.getTotalInteraction()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("gettotalfriendrequest")
  @ApiResponse({ status: HttpStatus.OK})
  async getTotalFriendRequest(
    @Res() res,
  ) {
    return await this.recordsService.getTotalFriendRequest()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  // Dove add S@...
  @Get("getuserinfo")
  @ApiResponse({ status: HttpStatus.OK})
  @ApiQuery({ name: "id", type: String, required: true })
  async getUserInfo(
    @Res() res,
    @Query("id") userId: string
  ) {
    return this.usersService.getUserInfo(userId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getusertransactionhistory")
  @ApiResponse({ status: HttpStatus.OK})
  @ApiQuery({ name: "id", type: String, required: true })
  @ApiQuery({ name: "page", type: Number, required: true })
  async getUserTransactionHistory(
    @Res() res,
    @Query("id") userId: string,
    @Query("page") page: Number,
  ) {
    return this.usersService.getUserTransactionHistory(userId, page, 5)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getopenappcount")
  @ApiResponse({ status: HttpStatus.OK})
  async getOpenAppCount(
    @Res() res
  ) {
    return await this.usersService.getOpenAppCount()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getpersessiontime")
  @ApiResponse({ status: HttpStatus.OK})
  async getPerSessionTime(
    @Res() res
  ) {
    return await this.usersService.getPerSessionTime()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getinvitelinks")
  @ApiResponse({ status: HttpStatus.OK})
  async getInviteLinks(
    @Res() res
  ) {
    return await this.usersService.getInviteLinks()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("getsharestories")
  @ApiResponse({ status: HttpStatus.OK})
  async getShareStories(
    @Res() res
  ) {
    return await this.usersService.getShareStories()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
  
  @Get("generaterandomeusers")
  @ApiResponse({ status: HttpStatus.OK})
  @ApiQuery({ name: "number", type: Number, required: true })
  async generateRandomeUsers(
    @Res() res,
    @Query("number") count: Number,
  ) {
    return await this.authService.generateRandomeUsers(count)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
  
}
