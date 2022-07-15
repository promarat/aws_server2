import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";
import { ApiProperty } from "@nestjs/swagger";
import { tagUser } from "src/lib/enum";

export class TagFriendsDto {
  
  @ApiProperty({ type: 'string' })
  storyId: string;

  @ApiModelProperty({type:'string'})
  storyType: string;

  @ApiModelProperty({type:[String]})
  tagUserIds: string[];

  @ApiProperty({ type: 'string' })
  recordId: string;

  @ApiProperty({ type: 'string' })
  answerId: string;
}