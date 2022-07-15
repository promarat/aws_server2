import {IsString, MaxLength, MinLength} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class SessionRequest {

    // @IsString()
    // @MinLength(3)
    // @MaxLength(50)
    @ApiProperty()
    id: string;

    // @IsString()
    // @MinLength(8)
    // @MaxLength(24)
    @ApiProperty()
    sessionTime: number;

}
