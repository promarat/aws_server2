import { ApiProperty } from "@nestjs/swagger";
import { IsDate, IsDateString, Max, MaxLength, Min, MinLength } from "class-validator";
import { GenderEnum } from "../../lib/enum";
import { ApiModelProperty } from "@nestjs/swagger/dist/decorators/api-model-property.decorator";

export class CompleteRegisterDto {

  @ApiProperty({example: "Jack"})
  @MinLength(3)
  @MaxLength(20)
  pseudo: string;

  @ApiProperty({example: new Date()})
  @IsDateString()
  dob: Date;

  @ApiProperty({example: 'Ukraine'})
  country: string;

  @ApiProperty()
  gender: string;
}
