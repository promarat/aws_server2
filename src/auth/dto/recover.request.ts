import { ApiProperty } from '@nestjs/swagger';


export class RecoverRequest {

  @ApiProperty({
    description: 'The id of current user',
    example: '1',
  })
  id: number;

  @ApiProperty({
    description: 'The users email',
    example: 'user@mail.com',
  })
  email: string;
}

export class ResetRequest {

  @ApiProperty({
    description: 'The user password',
    example: 'password',
    minimum: 8,
  })
  password: string;
}
