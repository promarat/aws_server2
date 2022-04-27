import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { DevicesEntity } from "src/entities/device.entity";
import { Repository, Not, MoreThan } from "typeorm";
import { GeneratorUtil } from "../lib/generator-util";
import { maxLength } from "class-validator";

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(DevicesEntity) private devicesRepository: Repository<DevicesEntity>,
  ) {
  }

  /*for auth*/
  findOneByEmail(email: string): Promise<UsersEntity> {
    return this.usersRepository.createQueryBuilder('user')
      .where('user.email ilike :email', { email })
      .select([
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
    return this.usersRepository.findOne({ id });
  }

  findById(id: string) {
    return this.usersRepository.findOne({ where: { id }, relations: ["avatar"] });
  }

  findByName(id: string, username: string) {
    return this.usersRepository.createQueryBuilder('user')
      .where({ name: username })
      .andWhere("user.id <> :userid", { userid: id })
      .select([
        "user.id",
      ])
      .getMany()
  }

  async findDevices() {
    const devices = await this.devicesRepository.createQueryBuilder('device')
      .select(["device.token"])
      .getMany();
    return devices.map((device) => device.token);
  }

  async findDevicesWithAnswer() {
    const users = await this.answersRepository.createQueryBuilder('answer')
      .leftJoin("answer.record", "record")
      .leftJoin("record.user", "user")
      .select(["user.id"])
      .getMany();
    const usersId = users.map((user) => user.user.id);
    return this.findDevicesWithUser(usersId);
  }

  async findDevicesWithUser(usersId) {
    const devices = await this.devicesRepository
      .createQueryBuilder("devices")
      .innerJoin("devices.user", "user", "user.id in (:...usersId)", { usersId })
      .select([
        "devices.token"
      ])
      .getMany();
    const tokens = devices.map((item)=>item.token)
    return tokens;
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
      male: await this.usersRepository.count({ where: { gender: "m" } }),
      female: await this.usersRepository.count({ where: { gender: "f" } })
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

  async deviceRegister(user, deviceToken, deviceOs) {
    const findDevice = await this.devicesRepository.findOne({ where: { token: deviceToken }, relations: ["user"] });
    if (findDevice) {
      if (findDevice.user.id != user.id) {
        const findUser = await this.getById(user.id);
        return this.devicesRepository.update(findDevice.id, { user: findUser });
      }
    }
    else {
      const findUser = await this.getById(user.id);
      const entity = new DevicesEntity();
      entity.token = deviceToken;
      entity.os = deviceOs;
      entity.user = findUser;
      return this.devicesRepository.save(entity);
    }
  }

}
