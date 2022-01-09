import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { Repository, Not, MoreThan } from "typeorm";
import { GeneratorUtil } from "../lib/generator-util";
import { maxLength } from "class-validator";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
  ) {
  }

  /*for auth*/
  findOneByEmail(email: string): Promise<UsersEntity> {
    return this.usersRepository.createQueryBuilder('user')
      .where( 'user.email ilike :email', { email })
      .select( [
        "user.id",
        "user.email",
        "user.pseudo",
        "user.password",
        "user.lastActivity",
      ])
      .getOne()
  }

  findOneByIdForPayload(id: string): Promise<UsersEntity> { // for refresh
    return this.usersRepository.findOne({ where: { id }, select: ["id", "pseudo", "email"] });
  }

  updateActivity(id: string) {
    const dateNow = new Date();
    return this.usersRepository
      .createQueryBuilder()
      .update(UsersEntity)
      .set({ lastActivity: dateNow })
      .where("users.id = :id", { id })
      .execute();
  }

  findByIdRecover(id: string): Promise<UsersEntity> {
    return this.usersRepository.findOne({ where: { id }, select: ["id", "email"] });
  }

  async updatePassword(request, id) {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException();
    }
    const password = await GeneratorUtil.generateHash(request.password);
    return this.usersRepository
      .createQueryBuilder("users")
      .update(UsersEntity)
      .set({ password: password })
      .where({ id: user.id })
      .execute();
  }

   updateAvatar(userId, entity) {
    return this.usersRepository.update(userId, entity)
  }

   getById(id: string) {
    return  this.usersRepository.findOne({ id });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id }, relations: ["avatar"] });
  }

  findByName(id: string, username: string) {
    return this.usersRepository.createQueryBuilder('user')
      .where( { name: username})
      .andWhere( "user.id <> :userid", {userid : id} )
      .select( [
        "user.id",
      ])
      .getMany()
  }

  createUser(newUser: UsersEntity): Promise<UsersEntity> {
    return this.usersRepository.save(newUser);
  }

  completeRegister(findUser: UsersEntity) {
    return this.usersRepository.save(findUser);
  }

  findUserByPseudo(pseudo) {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.pseudo ilike :pseudo', { pseudo })
      .select([
        'user.id',
        'user.pseudo',
        'user.gender',
      ])
      .getMany()
  }

  async getMFPercent() {
    return {
      male: await this.usersRepository.count({where: {gender: "m"}}),
      female: await this.usersRepository.count({where: {gender: "f"}})
    }
  }

  async getAverAge() {
    return {
      total: await this.usersRepository.createQueryBuilder("users")
      .select("AVG(SUBSTRING(CAST(users.dob AS VARCHAR), 1, 4)::numeric::integer)", "avg")
      .where('users.dob is not null')
      .getRawOne()
    }
  }
}
