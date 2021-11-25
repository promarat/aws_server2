import { ApiProperty } from "@nestjs/swagger";

export class LikesRequestDto {

  @ApiProperty({ type: Number, example: 10 })
  count: number;

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  id: string;

  @ApiProperty({ type: 'string', example: '😎'})
  emoji: string;
}
