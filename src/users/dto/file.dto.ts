import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { MessageTypeEnum } from "src/entities/message.entity";

export class FileDto {

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  type: MessageTypeEnum;

  @ApiModelProperty({ type: 'number', example: 45})
  duration: number;

  @ApiModelProperty({ type: 'string', format: 'binary', required: false })
  readonly file?: any;

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  record: string;

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  user: string;

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  ancestor: string;

  @ApiModelProperty({ type: 'string', example: '😎'})
  emoji: string;
}