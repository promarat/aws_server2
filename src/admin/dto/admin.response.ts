import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";
import { GenderEnum } from "../../lib/enum";
import { FileResponse } from "../../files/dto/file.response";
import { ApiProperty } from "@nestjs/swagger";

export class AdminResponse {

  @ApiModelProperty({ example: "26b756d7-afa1-4583-8cff-586acbec0918" })
  id: string;

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

  @ApiModelProperty({ example: false })
  isPrivate: boolean;

  @ApiProperty()
  gender: string;

  @ApiModelProperty({ example: 'Ukraine'})
  country: string;

  @ApiModelProperty({ example: new Date() })
  createdAt: Date;

  @ApiModelProperty({ example: new Date() })
  updatedAt: Date;

}

export class AdminLoginRequest {

  // @IsString()
  // @MinLength(3)
  // @MaxLength(50)
  @ApiProperty({
      description: 'The users email',
      example: 'user@mail.com',
  })
  email: string;

  // @IsString()
  // @MinLength(8)
  // @MaxLength(24)
  @ApiProperty({
      description: 'The user password',
      example: 'password',
      minimum: 8,
  })
  password: string;

}

export class AdminLoginResponse {

  @ApiProperty({
    description: 'The id of current user',
    example: '1',
  })
  id: string;

  @ApiProperty({
    description: 'access jwt token',
    example: 'eyJhbGci...',
  })
  accessToken: string;

  @ApiProperty({
    example: '300',
  })
  expiresAt: number;

  @ApiProperty({
    description: 'refresh jwt token',
    example: 'eyJhbGci...',
  })
  refreshToken: string;
}

export class AdminRefreshResponse {

  @ApiProperty({
    description: 'access jwt token',
    example: 'eyJhbGci...',
  })
  accessToken: string;

  @ApiProperty({
    example: '300',
  })
  expiresAt: number;

  @ApiProperty({
    description: 'refresh jwt token',
    example: 'eyJhbGci...',
  })
  refreshToken: string;

}
