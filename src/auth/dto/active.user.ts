import { ApiProperty } from '@nestjs/swagger';
import { randomUUID } from "crypto";

export class ActiveUser {
  @ApiProperty({
    description: 'The id of current user',
    example: randomUUID(),
  })
  id: string;

  @ApiProperty({
    description: 'The pseudo of current user',
    example: 'pseudo',
  })
  pseudo: string;

  @ApiProperty({
    description: 'The email of current user',
    example: 'user@mail.com',
  })
  email: string;
}