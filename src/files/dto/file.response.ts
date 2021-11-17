import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class FileResponse {
  @ApiModelProperty({ type: "string", example: "0f6e280e-44cd-42de-a627-83876e6fb772" })
  id: string;

  @ApiModelProperty({
    type: "string",
    // eslint-disable-next-line max-len
    example: "https://social-voice-app.s3.us-east-2.amazonaws.com/dcf54aaa-6c04-4b7c-bb5e-2a6428445ce5-artworks-ndzeDTX4MBoNOykS-5wcY1A-t500x500.jpg"
  })
  url: string;

  // @ApiModelProperty({ type: FileTypeEnum })
  @ApiModelProperty()
  type: string;

  @ApiModelProperty({
    type: "string",
    example: "https://api.vocco.io/img/0f6e280e-44cd-42de-a627-83876e6fb772?auto=compress&q=20"
  })
  link: string;

  @ApiModelProperty({
    type: "string",
    example: "dcf54aaa-6c04-4b7c-bb5e-2a6428445ce5-artworks-ndzeDTX4MBoNOykS-5wcY1A-t500x500.jpg"
  })
  key: string;
}
