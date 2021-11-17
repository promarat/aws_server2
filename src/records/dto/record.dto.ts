import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class RecordDto {

  @ApiModelProperty({ type: 'string', })
  title: string;

  @ApiModelProperty({ type: 'string', example: '😎'})
  emoji: string;

  @ApiModelProperty({ type: 'string', example: 45})
  duration: string;

  @ApiModelProperty({ type: 'string', format: 'binary', required: true })
  file: any;
}
