import { UsersResponse } from "../../users/dto/users.response";
import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class AccountMeResponse extends UsersResponse {

  @ApiModelProperty({example: 2, description: 'count of created records today'})
  todayRecordCount: number;

  @ApiModelProperty({example: 2, description: 'count of remaining records today'})
  leftRecordCount: number;

  @ApiModelProperty({example: 2, description: 'count of answers today'})
  answerCount: number;

}
