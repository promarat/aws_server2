import { ApiProperty } from "@nestjs/swagger";

export class LikesRequestDto {

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  id: string;

}
