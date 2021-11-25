import { UsersResponse } from "../../users/dto/users.response";
import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class UnreadNotificationResponse extends UsersResponse {

  @ApiModelProperty({example: 2, description: 'unread notification counts'})
  count: number;
}