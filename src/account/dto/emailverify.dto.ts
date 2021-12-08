import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsDateString, Max, MaxLength, Min, MinLength } from "class-validator";
import { GenderEnum } from "../../lib/enum";
import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class EmailVerify {

  @ApiProperty({example: "123456"})
  @MinLength(3)
  @MaxLength(20)
  pseudo: string;
}

export class UsernameVerifyResponse {
  @ApiModelProperty({example: 'OK', description: 'count of answers today'})
  resp: string;
}