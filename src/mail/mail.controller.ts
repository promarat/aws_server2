import {
  Controller,
  Logger,
} from "@nestjs/common";
import { ApiBearerAuth,  ApiTags } from "@nestjs/swagger";
import { MailsService } from "./mail.service";

@Controller("mail")
@ApiBearerAuth()
@ApiTags("mail")
export class MailController {
  private readonly logger = new Logger(MailController.name);
  constructor(private readonly mailService: MailsService) {
  }
}
