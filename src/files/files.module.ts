import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import { TypeOrmModule } from "@nestjs/typeorm";
import { PublicFileEntity } from "../entities/public-file.entity";
import { FilesController } from './files.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature(
      [
        PublicFileEntity
      ])
  ],
  providers: [FileService],
  exports: [FileService],
  controllers: [FilesController]
})
export class FileModule {}
