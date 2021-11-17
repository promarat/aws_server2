import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";
import { GenderEnum } from "../../lib/enum";
import { FileResponse } from "../../files/dto/file.response";
import { ApiProperty } from "@nestjs/swagger";

export class UsersResponse {

  @ApiModelProperty({ example: "26b756d7-afa1-4583-8cff-586acbec0918" })
  id: string;

  @ApiModelProperty({ example: "jackie" })
  pseudo: string;

  @ApiModelProperty({ example: "user@mail.com"})
  email: string;

  @ApiModelProperty({ example: new Date() })
  lastActivity: Date;

  @ApiModelProperty({ example: true })
  isActive: boolean;

  @ApiModelProperty({ example: new Date() })
  dob: Date

  @ApiModelProperty({ example: false })
  isProfileCompleted: boolean;

  @ApiModelProperty({ example: false })
  isEmailVerified: boolean;

  @ApiProperty()
  gender: string;

  @ApiModelProperty({ example: 'Ukraine'})
  country: string;

  @ApiModelProperty({ example: new Date() })
  createdAt: Date;

  @ApiModelProperty({ example: new Date() })
  updatedAt: Date;

  @ApiModelProperty()
  avatar: FileResponse
}
