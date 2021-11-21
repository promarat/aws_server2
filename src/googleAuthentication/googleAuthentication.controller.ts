import {
    Controller,
    Post,
    ClassSerializerInterceptor, Logger, UseInterceptors, Body, Req, Res, HttpStatus,
  } from '@nestjs/common';
  import TokenVerificationDto from './tokenVerification.dto';
  import { GoogleAuthenticationService } from './googleAuthentication.service';
  import { Request } from 'express';
  import { LoginResponse } from '../auth/dto/login.response';
  import { ApiResponse, ApiTags } from "@nestjs/swagger";
  import { AuthService } from 'src/auth/auth.service';

  @Controller()
//   @ApiTags("googleauth")
//   @UseInterceptors(ClassSerializerInterceptor)
  export class GoogleAuthenticationController {
    private readonly logger = new Logger(GoogleAuthenticationController.name);

    constructor(
      private readonly googleAuthenticationService: GoogleAuthenticationService,
      private authService: AuthService
    ) {
    }
  
    @Post("googleauth")
    @ApiResponse({ status: HttpStatus.CREATED, description: "User data with jwt token", type: LoginResponse })
    @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Unauthorized" })
    async authenticate(
        @Res() res,
        @Body() tokenData: TokenVerificationDto
    ): Promise<LoginResponse> {
        console.log("googleauth--", tokenData.token);
        const user =  await this.googleAuthenticationService.authenticate(tokenData.token)
        console.log("googleauth user--", user);
        return await this.authService.login(null, "", user)
        .then((data) => res.json(data))
        .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
    }
    
  }