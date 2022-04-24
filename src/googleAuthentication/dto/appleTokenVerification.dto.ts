import { IsString, IsNotEmpty } from 'class-validator';

export class AppleTokenVerificationDto {
  @IsString()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  identityToken: string;
}

export default AppleTokenVerificationDto;