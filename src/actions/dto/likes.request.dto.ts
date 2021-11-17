import { ApiProperty } from "@nestjs/swagger";

export class LikesRequestDto {

  @ApiProperty({ type: Number, example: 10 })
  count: number;
}
