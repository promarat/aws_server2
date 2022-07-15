import { ApiProperty } from '@nestjs/swagger';


export class LoginResponse {

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

export class RefreshResponse {

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