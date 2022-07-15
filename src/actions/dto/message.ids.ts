import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";
import { ApiProperty } from "@nestjs/swagger";

export class MessageIds {

  @ApiModelProperty({type:[String]})
  messageIds: string[];

}