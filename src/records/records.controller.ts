import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger, Param,
  Post, Put, Query,Delete,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { RecordsService } from "./records.service";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags ,ApiCreatedResponse,ApiUnauthorizedResponse } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { RecordDto } from "./dto/record.dto";
import { RecordDataDto } from "./dto/record.profile";
import { RecordAnswersResponse, RecordsResponse, ServeralCountResponse } from "./dto/records.response";
import { Order } from "../lib/enum";
import { RecordData } from "aws-sdk/clients/route53";
import { MailsService } from "src/mail/mail.service";

@Controller("records")
@ApiBearerAuth()
@ApiTags("records")
export class RecordsController {
  private readonly logger = new Logger(RecordsController.name);
  constructor(
    private readonly recordsService: RecordsService,
    private mailService: MailsService,
  ) {
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'userid', type: String})
  @Get("me")
  userRecords(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('userid') userid: String
  ) {
    const user = req.user;
    var user_id = userid == "" ? user.id : userid;

    return this.recordsService.getRecordsByUser(user.id, skip, take, order, user_id) //todo add friend records
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordAnswersResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'answerId', type: String})
  @Get("answers")
  getAnswersByRecord(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('answerId') answerId: string,
  ) {
    const user = req.user;
    return this.recordsService.getAnswersByRecord(id, skip, take, order, user, answerId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordAnswersResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @Get("replyAnswers")
  getReplyAnswersByAnswer(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
  ) {
    const user = req.user;
    return this.recordsService.getReplyAnswersByAnswer(id, skip, take, order, user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: HttpStatus.CREATED, description: "The file has been uploaded"})
  @ApiOperation({ description: "change me" })
  @UseInterceptors(FileInterceptor("file"))
  async addRecord(
    @Req() request,
    @UploadedFile() file,
    @Body() body: RecordDto
  ) {
    const user = request.user;
    this.mailService.sentNotifyToFriends(user.id,`Discover the new story`,{nav:"Feed",params:{}});
    return this.recordsService.addRecord(body, user,file.buffer,file.originalname);
  }

  @Put("changevoice")
  @ApiCreatedResponse({ status: HttpStatus.CREATED, description: "The file has been uploaded" })
  @ApiUnauthorizedResponse()
  async completeRegister(
    @Req() req,
    @Body() body: RecordDataDto
  ) {
    const user = req.user;
    return this.recordsService.changeVoiceProfile(user, body);
  }

  @Put()
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: HttpStatus.CREATED, description: "The file has been uploaded"})
  @ApiOperation({ description: "change me" })
  @UseInterceptors(FileInterceptor("file"))
  async updateRecord(
    @Req() request,
    @UploadedFile() file,
    @Body() body: RecordDto
  ) {
    const user = request.user;
    return this.recordsService.updateRecord(body, user, file.buffer, file.originalname);
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED })
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'userId', type: String})
  @ApiQuery({ name: 'category', type: String})
  @ApiQuery({ name: 'search', type: String})
  @ApiQuery({ name: 'recordId', type: String})
  @ApiQuery({ name: 'friend', type: String})
  @Get("stories")
  allStories(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('userId') userId: string,
    @Query('category') category: string,
    @Query('search') search: string,
    @Query('recordId') recordId: string,
    @Query('friend') friend: string,
  ) {
    const { id } = req.user;
    return this.recordsService.getRecordsByUser(id, skip, take, order, userId, category, search, recordId, friend)
      .then((data) => {res.json(data);})
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'userId', type: String})
  @Get("temporary")
  temporaryRecords(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('userId') userId: string,
  ) {
    const user = req.user;
    return this.recordsService.getTemporariesByUser(user.id, skip, take, order, userId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'storyId', type: String})
  @ApiQuery({ name: 'storyType', type: String})
  @Get("storyLikes")
  storyLikes(
    @Req() req,
    @Res() res,
    @Query('storyId') storyId: string,
    @Query('storyType') storyType: string,
  ) {
    const user = req.user;
    return this.recordsService.getStoryLikes(user.id, storyId, storyType)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'other', type: String})
  @ApiQuery({ name: 'followType', type: String})
  @Get("getFollowUsers")
  followUsers(
    @Req() req,
    @Res() res,
    @Query('other') other: string,
    @Query('followType') followType: string,
  ) {
    const user = req.user;
    return this.recordsService.getFollowUsers(user.id, other, followType)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'skip', type: Number})
  @Get("getSuggests")
  getSuggests(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
  ) {
    const user = req.user;
    return this.recordsService.getSuggestUsers(user.id, skip)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @Get("getInvites")
  getInvites(
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
    return this.recordsService.getInviteUsers(user.id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED })
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'category', type: String})
  @ApiQuery({ name: 'search', type: String})
  @Get("discovertitle")
  allRecordstitles(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('category') category: string,
    @Query('search') search: string,
  ) {
    const { id } = req.user;
    return this.recordsService.getRecordstitle(id, skip, take, order, category, search)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [ServeralCountResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @Get("getseveralcount")
  @ApiQuery({ name: 'other', type: String})
  getSeveralCount(
    @Req() req,
    @Res() res,
    @Query('other') other: Order
  ) {
    const user = req.user;
    return this.recordsService.getSeveralCounts(user, other)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @Delete("deletevoice")
  deleteVoice(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
  ) {
    const user = req.user;
    return this.recordsService.deleteVoice(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @Delete("deleteAnswer")
  deleteAnswer(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
  ) {
    const user = req.user;
    return this.recordsService.deleteAnswer(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @Delete("deleteReplyAnswer")
  deleteReplyAnswer(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
  ) {
    const user = req.user;
    return this.recordsService.deleteReplyAnswer(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("listenStory")
  @ApiQuery({ name: 'id', type: String, required: true})
  @ApiQuery({ name: 'storyType', type: String, required: true})
  async listenStory(
    @Req() req,
    @Res() res,
    @Query("id") id,
    @Query("storyType") storyType,
  ) {
    const user = req.user;
    return this.recordsService.listenStory(user, id, storyType)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("shareStory")
  @ApiQuery({ name: 'id', type: String, required: true})
  @ApiQuery({ name: 'storyType', type: String, required: true})
  async shareStory(
    @Req() req,
    @Res() res,
    @Query("id") id,
    @Query("storyType") storyType,
  ) {
    const user = req.user;
    return this.recordsService.shareStory(user, id, storyType)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
}
