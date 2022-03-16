import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Logger, Param,
  Post, Put, Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { RecordsService } from "./records.service";
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { RecordDto } from "./dto/record.dto";
import { RecordAnswersResponse, RecordsResponse, ServeralCountResponse } from "./dto/records.response";
import { Order } from "../lib/enum";

@Controller("records")
@ApiBearerAuth()
@ApiTags("records")
export class RecordsController {
  private readonly logger = new Logger(RecordsController.name);
  constructor(private readonly recordsService: RecordsService) {
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
  @Get("answers")
  getAnswersByRecord(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order
  ) {
    const user = req.user;
    return this.recordsService.getAnswersByRecord(id, skip, take, order, user)
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
    return this.recordsService.addRecord(body, user, file.buffer, file.originalname);
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
  @ApiQuery({ name: 'category', type: String})
  @ApiQuery({ name: 'search', type: String})
  @Get("discover")
  allRecords(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order,
    @Query('category') category: string,
    @Query('search') search: string,
  ) {
    console.log("world-- ", skip, take, order, category, search);
    const { id } = req.user;
    return this.recordsService.getRecordsByUser(id, skip, take, order, "", category, search)
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
    console.log("world-- ", skip, take, order, category, search);
    const { id } = req.user;
    return this.recordsService.getRecordstitle(id, skip, take, order, category, search)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'skip', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'take', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @Get("list")
  records(
    @Req() req,
    @Res() res,
    @Query('skip') skip: number,
    @Query('take') take: number,
    @Query('order') order: Order
  ) {
    console.log("list-- ", skip, take);
    const user = req.user;
    return this.recordsService.getRecordsByUser(user.id, skip, take, order)
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
}
