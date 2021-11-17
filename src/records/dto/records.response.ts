import { ApiProperty } from "@nestjs/swagger";


export class RecordAnswersResponse {

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  id: string;

  @ApiProperty({ example: 44 })
  duration: number;

  @ApiProperty({ example: 2 })
  likesCount: number;

  @ApiProperty({ example: new Date() })
  createdAt: Date;

  @ApiProperty({
    example: {
        id: "37aabe08-b7de-48f1-85b3-85f886e9ba1f",
        pseudo: "Jack",
        avatar: null
    }
  })
  user: {
    id: string,
    pseudo: string,
    avatar: string,
  };

  @ApiProperty({
    example: {
        id: "9fa2bb55-6be4-4e2d-9613-db5f0629ff91",
        link: "/files/669fb1e0-9bae-4064-b845-bf02ec759e3a"
      }
  })
  file: {
    id: string;
    link: string;
  };
}

export class RecordsResponse {

  @ApiProperty({ example: "9daaf749-6202-4b6f-86fc-133ce7ed8c23" })
  id: string;

  @ApiProperty({ example: "title" })
  title: string;

  @ApiProperty({ example: "😎" })
  emoji: string;

  @ApiProperty({ example: 44 })
  duration: number;

  @ApiProperty({ example: 2 })
  colorType: number;

  @ApiProperty({ example: 2 })
  likesCount: number;

  @ApiProperty({ example: new Date() })
  createdAt: Date;

  @ApiProperty({
    example: {
        id: "37aabe08-b7de-48f1-85b3-85f886e9ba1f",
        pseudo: "Jack",
        avatar: null
    }
  })
  user: {
    id: string,
    pseudo: string,
    avatar: string,
  };

  @ApiProperty({
    example: {
        id: "9fa2bb55-6be4-4e2d-9613-db5f0629ff91",
        link: "/files/669fb1e0-9bae-4064-b845-bf02ec759e3a"
      }
  })
  file: {
    id: string;
    link: string;
  };
}