import { ApiProperty } from "@nestjs/swagger";

export class RecordDataDto {

  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  emoji: string;

  @ApiProperty()
  category: string;

  @ApiProperty()
  privacy: boolean;

  @ApiProperty()
  temporary: boolean;
}
