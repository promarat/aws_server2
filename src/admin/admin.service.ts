import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AdminEntity } from "../entities/admin.entity";
import { Repository } from "typeorm";

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminEntity) private adminRepository: Repository<AdminEntity>,
  ) {
  }

  /*for auth*/
  findOneByEmail(email: string): Promise<AdminEntity> {
    return this.adminRepository.createQueryBuilder('admin')
      .where('admin.email ilike :email', { email })
      .select([
        "admin.id",
        "admin.email",
        "admin.password",
        "admin.lastActivity",
      ])
      .getOne()
  }

  async createAdminUser(newAdminUser: AdminEntity): Promise<AdminEntity> {
    return await this.adminRepository.save(newAdminUser);
  }

  updateActivity(id: string) {
    const dateNow = new Date();
    return this.adminRepository
      .createQueryBuilder()
      .update(AdminEntity)
      .set({ lastActivity: dateNow })
      .where("users.id = :id", { id })
      .execute();
  }

  findOneByIdForPayload(id: string): Promise<AdminEntity> { // for refresh
    return this.adminRepository.findOne({ where: { id }, select: ["id", "email"] });
  }

}
