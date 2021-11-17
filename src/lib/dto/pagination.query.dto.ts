import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, Max, Min } from "class-validator";
import { Order } from "../enum";

export class PaginationQueryDto {

  @ApiPropertyOptional({ enum: Order, default: Order.DESC})
  @IsOptional()
  order: Order;

  @ApiProperty({example: 1})
  @IsOptional()
  page: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 50, default: 10 })
  @Min(10)
  @Max(50)
  @IsOptional()
  limit: number = 10;

}