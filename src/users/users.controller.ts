import {
  Controller,
  Get,
  Logger,
  Query,
  Req,
  Res,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { ApiBearerAuth, ApiQuery, ApiTags } from "@nestjs/swagger";

@Controller("users")
@ApiBearerAuth()
@ApiTags("users")
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private usersService: UsersService) {
  }

  @Get("search")
  @ApiQuery({ name: "pseudo", required: true })
  async findUser(
    @Req() req,
    @Res() res,
    @Query("pseudo") pseudo: string
  ) {
    return this.usersService.findUserByPseudo(pseudo)
      .then((data) => res.json(data))
      .catch(err => !err.status ? this.logger.error(err) : res.status(err.status).send(err.response));
  }

}
