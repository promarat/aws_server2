import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class AvatarDto {
  @ApiModelProperty({ type: 'string', format: 'binary', required: true })
  file: any;
}
