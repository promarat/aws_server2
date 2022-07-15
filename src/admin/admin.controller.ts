import {
  Controller,
  Body,
  HttpStatus,
  Post,
  Get,
  Logger,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { AdminService } from "./admin.service";
import { AdminLoginRequest, AdminLoginResponse } from "./dto/admin.response";
import { ApiBearerAuth, ApiResponse, ApiQuery, ApiTags } from "@nestjs/swagger";

@Controller("admin")
@ApiBearerAuth()
@ApiTags("admin")
export class AdminController {
  private readonly logger = new Logger(AdminController.name);
  constructor(private adminService: AdminService) {
  }

}
