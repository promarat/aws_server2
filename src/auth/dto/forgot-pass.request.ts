import { ApiProperty } from '@nestjs/swagger';


export class ForgotPassRequest {

  @ApiProperty({
    description: 'The users email',
    example: 'user@mail.com',
  })
  email: string;
}
