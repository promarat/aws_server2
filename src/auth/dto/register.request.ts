import {IsString, MaxLength, MinLength} from "class-validator";

export class RegisterRequest {

    @IsString()
    @MinLength(3)
    @MaxLength(50)
    pseudo: string;

    @IsString()
    @MinLength(8)
    @MaxLength(24)
    password: string;

}