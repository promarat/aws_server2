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
  ApiTags,
  ApiQuery,
  ApiResponse
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { FileDto } from "../users/dto/file.dto";
import { LikesRequestDto } from "./dto/likes.request.dto";
import { ReportRequestDto } from "./dto/report.request";
import { TagFriendsDto } from "src/users/dto/tagFriends.dto";
import { MessageIds } from "./dto/message.ids";

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
    return this.actionsService.answerToRecord(user, body.record, body.duration, body.emoji, file.buffer, file.originalname)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("tagFriends")
  @ApiCreatedResponse({ status: HttpStatus.CREATED,  description: "" })
  async tagFriends(
    @Res() res,
    @Req() req,
    @Body() body: TagFriendsDto
  ) {
    const user = req.user;
    return this.actionsService.tagFriends(user, body.storyId, body.storyType, body.tagUserIds, body.recordId, body.answerId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @Delete("deleteTag")
  deleteTag(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
  ) {
    const user = req.user;
    return this.actionsService.deleteTag(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("deleteMessages")
  @ApiCreatedResponse({ status: HttpStatus.CREATED,  description: "" })
  async deleteMessages(
    @Res() res,
    @Req() req,
    @Body() body: MessageIds
  ) {
    return this.actionsService.deleteMessages(body.messageIds)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  

  @ApiResponse ({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'storyId', type: String})
  @ApiQuery({ name: 'storyType', type: String})
  @Get("getTags")
  getTagsByStory(
    @Req() req,
    @Res() res,
    @Query('storyId') storyId: string,
    @Query('storyType') storyType: string,
  ) {
    const user = req.user;
    return this.actionsService.getTags(user, storyId, storyType)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse ({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'tagId', type: String})
  @Get("getTagUsers")
  getTagUsers(
    @Req() req,
    @Res() res,
    @Query('tagId') tagId: string,
  ) {
    const user = req.user;
    return this.actionsService.getTagUsers(user, tagId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse ({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @Get("getActiveUsers")
  getActiveUsers(
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
    return this.actionsService.getActiveUsers()
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse ({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'toUserId', type: String})
  @Get("getMessages")
  getMessages(
    @Req() req,
    @Res() res,
    @Query('toUserId') toUserId: string,
  ) {
    const user = req.user;
    return this.actionsService.getMessages(user, toUserId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse ({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'toUserId', type: String})
  @Get("confirmMessage")
  confirmMessage(
    @Req() req,
    @Res() res,
    @Query('toUserId') toUserId: string,
  ) {
    const user = req.user;
    return this.actionsService.confirmMessage(user, toUserId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse ({ status: HttpStatus.OK })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @Get("getConversations")
  getConversations(
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
    return this.actionsService.getConversations(user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("answerReply")
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({ status: HttpStatus.CREATED, description: "The file has been uploaded" })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "answer not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "you already replied" })
  @UseInterceptors(FileInterceptor("file"))
  async answerReply(
    @Req() req,
    @Res() res,
    @UploadedFile() file,
    @Body() body: FileDto
  ) {
    const user = req.user;
    return this.actionsService.replyToAnswer(user, body.record, body.duration, file.buffer, file.originalname)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("addMessage")
  @ApiConsumes("multipart/form-data")
  @ApiCreatedResponse({ status: HttpStatus.CREATED, description: "The message has been created" })
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "user not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "Unknown err" })
  @UseInterceptors(FileInterceptor("file"))
  async addMessage(
    @Req() req,
    @Res() res,
    @UploadedFile() file,
    @Body() body: FileDto
  ) {
    const user = req.user;
    return this.actionsService.addMessage(user, body, file)
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
    return this.actionsService.likeAnswer(user, body.id)
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
    return this.actionsService.likeRecord(user, body.id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
  
  @Post("recordreaction")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "record not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "reaction exist" })
  // @ApiParam({ name: "id", type: String, required: true })
  async recordReaction(
    @Req() req,
    @Res() res,
    @Body() body: LikesRequestDto,
    // @Param("id") recordId: string
  ) {
    const user = req.user;
    return this.actionsService.reactionRecord(user, body.id, body)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("answerunlike")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "answer not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like not found" })
  @ApiQuery({ name: 'id', type: String, required: true})
  async unLikeAnswer(
    @Req() req,
    @Res() res,
    @Query("id") answerId
  ) {
    const user = req.user;
    return this.actionsService.unLikeAnswer(user.id, answerId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("recordunlike")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "record not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like not found" })
  @ApiQuery({ name: 'id', type: String, required: true})
  async unLikeRecord(
    @Req() req,
    @Res() res,
    @Query("id") recordId
  ) {
    const user = req.user;
    return this.actionsService.unLikeRecord(user.id, recordId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("tagLike")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "tag not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "tag not found" })
  @ApiQuery({ name: 'id', type: String, required: true})
  @ApiQuery({ name: 'isLike', type: String, required: true})
  async likeTag(
    @Req() req,
    @Res() res,
    @Query("id") tagId,
    @Query("isLike") isLike,
  ) {
    const user = req.user;
    return this.actionsService.likeTag(user, tagId, isLike)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("replyAnswerLike")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "answer not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like not found" })
  @ApiQuery({ name: 'id', type: String, required: true})
  async likeReplyAnswer(
    @Req() req,
    @Res() res,
    @Query("id") replyAnswerId
  ) {
    const user = req.user;
    return this.actionsService.likeReplyAnswer(user.id, replyAnswerId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("replyAnswerUnlike")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND, description: "answer not found" })
  @ApiBadRequestResponse({ status: HttpStatus.BAD_REQUEST, description: "like not found" })
  @ApiQuery({ name: 'id', type: String, required: true})
  async unLikeReplyAnswer(
    @Req() req,
    @Res() res,
    @Query("id") replyAnswerId
  ) {
    const user = req.user;
    return this.actionsService.unLikeReplyAnswer(user.id, replyAnswerId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

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

  @Post("deleteSuggest")
  @ApiParam({ name: "userId", required: true, type: String })
  async deleteSuggest(
    @Req() req,
    @Res() res,
    @Query("userId") id: string
  ) {
    const user = req.user;
    return this.actionsService.deleteSuggest(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("deleteFollower")
  @ApiParam({ name: "userId", required: true, type: String })
  async deleteFollower(
    @Req() req,
    @Res() res,
    @Query("userId") id: string
  ) {
    const user = req.user;
    return this.actionsService.removeFriend(id, user.id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("deleteFollowing")
  @ApiParam({ name: "userId", required: true, type: String })
  async deleteFollowing(
    @Req() req,
    @Res() res,
    @Query("userId") id: string
  ) {
    const user = req.user;
    return this.actionsService.removeFriend(user.id, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("inviteFriend")
  @ApiParam({ name: "phoneNumber", required: true, type: String })
  async inviteFriend(
    @Req() req,
    @Res() res,
    @Query("phoneNumber") phoneNumber: string
  ) {
    const user = req.user;
    return this.actionsService.inviteFriend(user, phoneNumber)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("acceptfriend")
  @ApiParam({ name: "id", required: true, type: String })
  @ApiParam({ name: "requestId", required: true, type: String })
  async addFriend(
    @Req() req,
    @Res() res,
    @Query("id") id: string,
    @Query("requestId") requestId: string
  ) {
    const user = req.user;
    return this.actionsService.acceptFriend(user, id, requestId)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Get("unfollow")
  @ApiParam({ name: "id", required: true, type: Number })
  async deleteFriend(
    @Req() req,
    @Res() res,
    @Query("id") id: string
  ) {
    const user = req.user;
    return this.actionsService.removeFriend(user.id, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("block")
  @ApiParam({ name: "userid", required: true, type: String })
  async blockUser(
    @Req() req,
    @Res() res,
    @Query("userid") id: string
  ) {
    const user = req.user;
    return this.actionsService.blockUser(user, id)
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

  @Get("shareLink")
  async shareLink(
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
    return this.actionsService.shareLink(user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Delete("record")
  @ApiParam({ name: "id", required: true, type: Number })
  async deleteRecord(
    @Req() req,
    @Res() res,
    @Query("id") id: string
  ) {
    const user = req.user;
    return this.actionsService.removeRecord(user.id, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @Post("report")
  @ApiNotFoundResponse({ status: HttpStatus.NOT_FOUND })
  async createReport(
    @Req() req,
    @Res() res,
    @Body() body: ReportRequestDto,
  ) {
    const user = req.user;
    return this.actionsService.createReport(user, body.type, body.target, body.record, body.answer)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
}
