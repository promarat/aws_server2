import { Controller, Get, Param, Req, Res } from "@nestjs/common";
import { FileService } from "./file.service";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@Controller()
@ApiBearerAuth()
@ApiTags("files")
export class FilesController {
  constructor(private readonly filesService: FileService) {
  }

  @Get("files/:id")
  async getPrivateFile(
    @Req() request,
    @Param("id") id: string,
    @Res() res
  ) {
    const file = await this.filesService.getPrivateFile(id);
    res.writeHead(200, { "Content-Type": "audio/mpeg" });
    return file.stream.pipe(res);
  }

  @Get("img/:id")
  async getPrivateImg(
    @Req() request,
    @Param("id") id: string,
    @Res() res
  ) {
    const file = await this.filesService.getPrivateFile(id);
    res.writeHead(200, { "Content-Type": "image/jpeg" });
    return file.stream.pipe(res);
  }
}
