import { Controller, Get, Post, Delete, HttpStatus, Logger, Param, Put, Query, Req, Res } from "@nestjs/common";
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
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'type', required: true, type: String})
  @Get("getnotifications")
  getNotifications(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('type') type: string
  ) {
    const user = req.user;
    return this.notificationsService.getNotificationsByUser(skip, take, order, type, user)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  // @ApiResponse({ status: HttpStatus.OK, type: [RecordAnswersResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @Put("seen")
  setSeenNotification(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
  ) {
    const user = req.user;
    return this.notificationsService.seenNotification(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @Delete("deletenotification")
  deleteNotification(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
  ) {
    const user = req.user;
    return this.notificationsService.deleteNotification(user, id)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'type', required: true, type: String, description: 'type of notification'})
  @Put("allseen")
  markAllAsRead(
    @Req() req,
    @Res() res,
    @Query('type') type: string,
  ) {
    const user = req.user;
    return this.notificationsService.markAllAsRead(user, type)
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
