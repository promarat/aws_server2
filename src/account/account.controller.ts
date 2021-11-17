import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Put,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { AccountService } from "./account.service";
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags, ApiUnauthorizedResponse
} from "@nestjs/swagger";
import { CompleteRegisterDto } from "./dto/complete-register.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { AvatarDto } from "./dto/avatar.dto";
import { AccountMeResponse } from "./dto/account-me.response";
import { UsersResponse } from "../users/dto/users.response";
import { FileResponse } from "../files/dto/file.response";

@Controller("account")
@ApiBearerAuth()
@ApiTags("account")
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(private accountService: AccountService) {
  }

  @Get("me")
  @ApiCreatedResponse({
    status: HttpStatus.CREATED,
    type: AccountMeResponse,
    description: "The file has been uploaded"
  })
  @ApiUnauthorizedResponse()
  async getAccountInfo(
    @Req() req,
    @Res() res
  ) {
    const user = req.user;
    return this.accountService.getAccountData(user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Put()
  @ApiCreatedResponse({ status: HttpStatus.CREATED, type: UsersResponse, description: "The file has been uploaded" })
  @ApiUnauthorizedResponse()
  async completeRegister(
    @Req() req,
    @Res() res,
    @Body() body: CompleteRegisterDto
  ) {
    const user = req.user;
    return this.accountService.updateProfile(user, body)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("avatar")
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({ status: HttpStatus.CREATED, type: FileResponse, description: "The file has been uploaded" })
  @ApiUnauthorizedResponse()
  @ApiOperation({ description: "field name: \"file\" | max item size: 4mb | file extension: jpg|jpeg|png" })
  @UseInterceptors(FileInterceptor("file"))
  async addAvatar(
    @Req() req,
    @Res() res,
    @UploadedFile() file,
    @Body() body: AvatarDto
  ) {
    const user = req.user;
    return this.accountService.addAvatar(user.id, file.buffer, file.originalname)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

}
