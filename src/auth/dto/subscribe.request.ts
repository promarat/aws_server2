import {IsString, MaxLength, MinLength} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";

export class SubScribeRequest {

    @IsString()
    @MinLength(3)
    @MaxLength(50)
    @ApiProperty({
        description: 'The users email',
        example: 'user@mail.com',
    })
    email: string;
}
