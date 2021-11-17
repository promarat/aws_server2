import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class FileDto {

  @ApiModelProperty({ type: 'number', example: 45})
  duration: number;

  @ApiModelProperty({ type: 'string', format: 'binary', required: false })
  readonly file?: any;
}