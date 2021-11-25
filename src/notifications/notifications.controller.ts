import { Controller, Get, Post, HttpStatus, Logger, Param, Put, Query, Req, Res } from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { ApiParam, ApiQuery, ApiResponse, ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Order } from "../lib/enum";
import { UnreadNotificationResponse } from "./dto/notificationresponse.dto";

@Controller('notifications')
@ApiBearerAuth()
@ApiTags("notifications")
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);
  constructor(private  readonly notificationsService: NotificationsService) {
  }


  // @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @Get("getnotifications")
  userRecords(
    @Req() req,
    @Res() res,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('order') order: Order
  ) {
    const user = req.user; console.log(user);
    return this.notificationsService.getNotificationsByUser(page, limit, order, user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  // @ApiResponse({ status: HttpStatus.OK, type: [RecordAnswersResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiParam({ name: 'id', required: true, type: String, description: 'id of record'})
  @Put(":id/seen")
  getAnswersByRecord(
    @Req() req,
    @Res() res,
    @Param('id') id: string,
  ) {
    const user = req.user;
    return this.notificationsService.seenNotification(id, user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiResponse({ status: HttpStatus.OK, type: [UnreadNotificationResponse] })
  @Post("UnreadArticleCount")
  getUnreadArticleCount(
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
    return this.notificationsService.getUnreadArticleCount(user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiResponse({ status: HttpStatus.OK, type: [UnreadNotificationResponse] })
  @Post("UnreadRequestCount")
  getUnreadRequestCount(
    @Req() req,
    @Res() res,
  ) {
    const user = req.user;
    return this.notificationsService.getUnreadRequestCount(user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
}
