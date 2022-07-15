import {IsString, MaxLength, MinLength} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class LoginRequest {

    // @IsString()
    // @MinLength(3)
    // @MaxLength(50)
    @ApiProperty({
        description: 'The users email',
        example: 'user@mail.com',
    })
    email: string;

    // @IsString()
    // @MinLength(8)
    // @MaxLength(24)
    @ApiProperty({
        description: 'The user password',
        example: 'password',
        minimum: 8,
    })
    password: string;

}
