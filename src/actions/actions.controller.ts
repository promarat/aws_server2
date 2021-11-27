import {
  Body,
  Controller, Delete, Get,
  HttpStatus, Logger,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { ActionsService } from "./actions.service";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiTags
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileDto } from "../users/dto/file.dto";
import { LikesRequestDto } from "./dto/likes.request.dto";

@Controller("actions")
@ApiBearerAuth()
@ApiTags("actions")
export class ActionsController {
  private readonly logger = new Logger(ActionsController.name);

  constructor(private actionsService: ActionsService) {
  }

  @Post("answer")
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({ status: HttpStatus.CREATED, description: "The file has been uploaded" })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "record not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "you already answered" })
  @UseInterceptors(FileInterceptor("file"))
  async answer(
    @Req() req,
    @Res() res,
    // @Query("record") record: string,
    @UploadedFile() file,
    @Body() body: FileDto
  ) {
    const user = req.user;
    return this.actionsService.answerToRecord(user, body.record, body.duration, file.buffer, file.originalname)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("answerappreciate")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "answer not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like exist" })
  @ApiParam({ name: "id", type: String, required: true })
  async likeAnswer(
    @Req() req,
    @Res() res,
    @Body() body: LikesRequestDto,
    // @Param("id") answerId: string,
  ) {
    const user = req.user;
    return this.actionsService.likeAnswer(user, body.id, body)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("recordappreciate")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "record not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like exist" })
  @ApiParam({ name: "id", type: String, required: true })
  async likeRecord(
    @Req() req,
    @Res() res,
    @Body() body: LikesRequestDto,
    // @Param("id") recordId: string
  ) {
    const user = req.user;
    return this.actionsService.likeRecord(user, body.id, body)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  // @Post("answer/:id/unlike")
  // @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "answer not found" })
  // @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like not found" })
  // @ApiParam({ name: "id", type: String, required: true })
  // async unLikeAnswer(
  //   @Req() req,
  //   @Res() res,
  //   @Param("id") answerId
  // ) {
  //   const user = req.user;
  //   return this.actionsService.unLikeAnswer(user.id, answerId)
  //     .then((data) => res.json(data))
  //     .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  // }

  // @Post("record/:id/unlike")
  // @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "record not found" })
  // @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like not found" })
  // @ApiParam({ name: "id", type: String, required: true })
  // async unLikeRecord(
  //   @Req() req,
  //   @Res() res,
  //   @Param("id") recordId
  // ) {
  //   const user = req.user;
  //   return this.actionsService.unLikeRecord(user.id, recordId)
  //     .then((data) => res.json(data))
  //     .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  // }


  @Post("follow")
  @ApiParam({ name: "userid", required: true, type: String })
  async requestFollow(
    @Req() req,
    @Res() res,
    @Query("userid") id: string
  ) {
    const user = req.user;
    return this.actionsService.followFriend(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("acceptfriend")
  @ApiParam({ name: "id", required: true, type: String })
  async addFriend(
    @Req() req,
    @Res() res,
    @Query("id") id: string
  ) {
    const user = req.user;
    return this.actionsService.acceptFriend(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Delete("unfollow")
  @ApiParam({ name: "id", required: true, type: Number })
  async deleteFriend(
    @Req() req,
    @Res() res,
    @Query("id") id: string
  ) {
    const user = req.user;
    return this.actionsService.removeFriend(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("countries")
  async getAllCountries(
    @Res() res
  ) {
    return this.actionsService.getAllCountries()
      .then((data) => res.json(data))
      .catch(err => !err.status ? console.log(err) : res.status(err.status).send(err.message));
  }

  @Delete("record")
  @ApiParam({ name: "id", required: true, type: Number })
  async deleteRecord(
    @Req() req,
    @Res() res,
    @Query("id") id: string
  ) {
    console.log("delete record--", id);
    const user = req.user;
    return this.actionsService.removeRecord(user.id, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
}
