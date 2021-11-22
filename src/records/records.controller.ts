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
import { RecordAnswersResponse, RecordsResponse } from "./dto/records.response";
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
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @Get("me")
  userRecords(
    @Req() req,
    @Res() res,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('order') order: Order
  ) {
    const user = req.user;
    return this.recordsService.getRecordsByUser(user.id, page, limit, order, user) //todo add friend records
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordAnswersResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'id', required: true, type: String, description: 'id of record'})
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @Get("answers")
  getAnswersByRecord(
    @Req() req,
    @Res() res,
    @Query('id') id: string,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('order') order: Order
  ) {
    const user = req.user;
    return this.recordsService.getAnswersByRecord(id, page, limit, order, user)
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
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'category', type: String})
  @ApiQuery({ name: 'search', type: String})
  @Get("discover")
  allRecords(
    @Req() req,
    @Res() res,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('order') order: Order,
    @Query('category') category: string,
    @Query('search') search: string,
  ) {
    console.log("world-- ", page, limit, order, category, search);
    const { id } = req.user;
    return this.recordsService.getRecordsByUser(id, page, limit, order, null, category, search)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @ApiQuery({ name: 'category', type: String})
  @ApiQuery({ name: 'search', type: String})
  @Get("discovertitle")
  allRecordstitles(
    @Req() req,
    @Res() res,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('order') order: Order,
    @Query('category') category: string,
    @Query('search') search: string,
  ) {
    console.log("world-- ", page, limit, order, category, search);
    const { id } = req.user;
    return this.recordsService.getRecordstitle(id, page, limit, order, category, search)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

  @ApiResponse({ status: HttpStatus.OK, type: [RecordsResponse] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: "Responses" })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1})
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10})
  @ApiQuery({ name: 'order', required: true, enum: Order})
  @Get("list")
  records(
    @Req() req,
    @Res() res,
    @Query('page') page: number,
    @Query('limit') limit: number,
    @Query('order') order: Order
  ) {
    const user = req.user;
    return this.recordsService.getRecordsByUser(user.id, page, limit, order) //todo add friend records
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }
}
