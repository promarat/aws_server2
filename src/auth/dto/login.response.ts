import { ApiProperty } from '@nestjs/swagger';


export class LoginResponseData {
  data: LoginResponse;
}

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

  @ApiProperty({
    description: 'isRegister by Google or Apple APi',
    example: 'true or false',
  })
  isRegister?: boolean;
  
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