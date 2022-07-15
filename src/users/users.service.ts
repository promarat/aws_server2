import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository, InjectConnection } from "@nestjs/typeorm";
import { UsersEntity } from "../entities/users.entity";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { DevicesEntity } from "src/entities/device.entity";
import { Repository, Not, MoreThan, Connection } from "typeorm";
import { GeneratorUtil } from "../lib/generator-util";
import { maxLength } from "class-validator";
import { HistoryEntity, HistoryTypeEnum } from "src/entities/history.entity";

@Injectable()
export class UsersService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(DevicesEntity) private devicesRepository: Repository<DevicesEntity>,
    @InjectRepository(HistoryEntity) private historyRepository: Repository<HistoryEntity>,
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

  findOneByPhoneNumber(phoneNumber: string): Promise<UsersEntity> {
    return this.usersRepository.findOne({where:{phoneNumber:phoneNumber}})
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
    const answers = await this.answersRepository.createQueryBuilder('answers')
      .innerJoin("answers.record", "record")
      .innerJoin("record.user", "user")
      .select(["answers.id","record.id","user.id"])
      .getMany();
    const usersId = answers.map((answer) => answer.record.user.id);
    return this.findDevicesWithUser([...new Set(usersId)]);
  }

  async findDevicesWithUser(ids) {
    const devices = await this.devicesRepository
      .createQueryBuilder("devices")
      .innerJoin("devices.user", "user", "user.id in (:...ids)", { ids })
      .select([
        "devices.token"
      ])
      .getMany();
    const tokens = devices.map((item)=>item.token)
    return [...new Set(tokens)];
  }

  async createUser(newUser: UsersEntity): Promise<UsersEntity> {
    return await this.usersRepository.save(newUser);
  }

  async deleteUser(user) {
    return await this.usersRepository.remove(user);
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
      total: await this.usersRepository.count(),
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
    const findDevice = await this.devicesRepository.createQueryBuilder("devices")
      .leftJoin("devices.user", "user")
      .select([
        "devices.token",
        "devices.id",
        "user.id",
      ])
      .where({token:deviceToken})
      .getOne();
    
    if (findDevice) {
      if (findDevice.user.id != user.id) {
        return await this.devicesRepository.update(findDevice.id, { user: user.id });
      }
      else
        return 1;
    }
    else {
      const entity = new DevicesEntity();
      entity.token = deviceToken;
      entity.os = deviceOs;
      entity.user = user;
      return await this.devicesRepository.save(entity);
    }
  }

  async getUsersCountMonth() {
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    const count = await this.usersRepository.createQueryBuilder('users')
      .where( 'users.createdAt >= :after', { after:  monthFirstDay })
      .andWhere('users.createdAt < :before', { before:  date })
      .select( [
        "users.id"
      ])
      .getCount()
    const growthPercent = await this.getUsersMonthToMonthGrowth();
    return {
      count,
      growthPercent,
    };
  }

  async getUsersMonthToMonthGrowth() {
    var date = new Date();
    var lastMonthfirstDay = new Date(date.getFullYear(), date.getMonth() - 1, 1);
    var lastMonthlastDay = new Date(date.getFullYear(), date.getMonth() , 0);
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const lastCount = await this.usersRepository.createQueryBuilder('users')
      .where( 'users.createdAt >= :after', { after:  lastMonthfirstDay})
      .andWhere('users.createdAt < :before', { before:  lastMonthlastDay })
      .select( [
        "users.id"
      ])
      .getMany()
    const count = await this.usersRepository.createQueryBuilder('users')
      .where( 'users.createdAt >= :after', { after:  monthFirstDay })
      .andWhere('users.createdAt < :before', { before:  date })
      .select( [
        "users.id"
      ])
      .getMany()
    
    let growthPercent = 100;
    if (lastCount.length){
      growthPercent = (count.length - lastCount.length) / lastCount.length * 100
    }
    return growthPercent
  }

  async getNewUsersThisWeek() {
    var curr = new Date();
    curr.setHours(0, 0, 0, 0);
    var first = curr.getDate() - curr.getDay();
    const lastWeekUsers = await this.usersRepository.createQueryBuilder('users')
      .where( 'users.createdAt >= :after', { after:  new Date(curr.setDate(first - 6)) })
      .andWhere('users.createdAt < :before', { before:  new Date(curr.setDate(first)) })
      .select( [
        "users.id"
      ])
      .getMany();
    var weekTotal = 0;
    var weekUsers = [];
    var datesArr = [];
    for (var i = 1 ; i <= 7; i++) {
      var last = first + i;
      var firstday = new Date(curr.setDate(last));
      var lastday = new Date(curr.setDate(last + 1));
      var dayilyUsers = await this.usersRepository.createQueryBuilder('users')
        .where( 'users.createdAt >= :after', { after:  firstday})
        .andWhere('users.createdAt < :before', { before:  lastday })
        .select( [
          "users.id"
        ])
        .getMany();
      weekTotal += dayilyUsers.length;
      weekUsers.push(dayilyUsers.length);
      datesArr.push(firstday);
    }
    var growthWeek = 100;
    if(lastWeekUsers.length) {
      growthWeek = Math.round(((weekTotal - lastWeekUsers.length) * 100 / lastWeekUsers.length) * 100) / 100
    }
    return {
      weekTotal,
      growthWeek,
      weekData:{weekUsers, datesArr}
    };
      
  }

  async getUsersDaily() {
    var curr = new Date();
    curr.setHours(0, 0, 0, 0);
    var first = curr.getDate();
    const todayUsers = await this.usersRepository.createQueryBuilder('users')
      .where( 'users.createdAt >= :after', { after:  curr })
      .andWhere('users.createdAt < :before', { before:  new Date(curr.setDate(first + 1)) })
      .select( [
        "users.id"
      ])
      .getMany();
    const lastUsers = await this.usersRepository.createQueryBuilder('users')
      .leftJoin('users.avatar','avatar')
      .select([
        "users.id",
        "users.name",
        "users.avatarNumber",
        "users.phoneNumber",
        "avatar.url"
      ])
      .orderBy('users.createdAt', 'DESC')
      .limit(6)
      .getMany();
    const totalUsers = await this.usersRepository.count();
    const avgYears = await this.getAverAge();
    var avgAge = new Date().getFullYear() - avgYears.total.avg * 1;
    var mfPercent = await this.getMFPercent();

    return {
      todayUsers: todayUsers.length,
      lastUsers,
      totalUsers,
      avgAge,
      mfPercent
    }
  }

  async getUsersByCountry() {
    const data = await this.connection.query(`SELECT COUNT("users"."id") AS "users_count", "users"."country" FROM "users" WHERE "users"."country" != '' GROUP BY "users"."country" ORDER BY "users_count" DESC`);
    const totalCount = await this.usersRepository.count();

    return {
      data,
      totalCount
    }
  }

  async getUsersStatisticsByCountry() {
    const users = await this.usersRepository.createQueryBuilder('users')
      .select( [
        "users.id",
        "users.createdAt",
        "users.country"
      ])
      .getMany();

    return {
      users
    }
  }
  
  async getPremiumUsersByMonth() {
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const premiumUsers = await this.usersRepository.createQueryBuilder('users')
      .where( 'users.createdAt >= :after', { after:  monthFirstDay})
      .andWhere('users.createdAt < :before', { before:  monthLastDay })
      .andWhere('users.premium != :premium', { premium:  "none" })
      .select( [
        "users.id",
        "users.createdAt"
      ])
      .getMany()

    return {
      premiumUsers
    }
  }

  async getSubScribeUserCount() {
    const count = await this.usersRepository.count();
    const lastCount = await this.getSubScribeUserMonthToMonthGrowth();
    let growthPercent = 100;
    if (lastCount){
      growthPercent = (count - lastCount) / lastCount * 100
    }
    const mfpercent = await this.getMFPercent();
    return {
      count,
      growthPercent,
      ...mfpercent
    };
  }

  async getSubScribeUserMonthToMonthGrowth() {
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    const lastCount = await this.usersRepository.createQueryBuilder('users')
      .where('users.createdAt < :before', { before:  monthFirstDay })
      .select( [
        "users.id"
      ])
      .getCount()
  
    return lastCount
      
  }

  async getDevicesByMonth() {
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const devices = await this.devicesRepository.createQueryBuilder('devices')
      .where( 'devices.createdAt >= :after', { after:  monthFirstDay})
      .andWhere('devices.createdAt < :before', { before:  monthLastDay })
      .select( [
        "devices.id",
        "devices.createdAt"
      ])
      .getMany()
    var lastMonthFirstDay = new Date(date.getFullYear(), date.getMonth() - 1 , 1);
    var lastMonthLastDay = new Date(date.getFullYear(), date.getMonth() , 1);
    const lmNumber = await this.devicesRepository.createQueryBuilder('devices')
      .where( 'devices.createdAt >= :after', { after:  lastMonthFirstDay})
      .andWhere('devices.createdAt < :before', { before:  lastMonthLastDay })
      .select( [
        "devices.id",
        "devices.createdAt"
      ])
      .getCount();


    return {
      devices,
      lmNumber
    }
  }


  async getUsers(skip, take) {
    const totalCount = await this.usersRepository.createQueryBuilder('users').getCount();
    const users = await this.usersRepository.createQueryBuilder('users')
      .leftJoin('users.avatar','avatar')
      .select([
        "users.id",
        "users.name",
        "users.email",
        "users.lastActivity",
        "users.isActive",
        "users.dob",
        "users.gender",
        "users.country",
        "users.premium",
        "users.avatarNumber",
        "users.phoneNumber",
        "users.createdAt",
        "avatar.url"
      ])
      .orderBy('users.createdAt', 'DESC')
      .skip((skip * 1 - 1) * take)
      .take(take)
      .getMany()
    let links = [];
    links.push(
      {
        url: skip > 1 ? `/?page=${skip * 1 - 1}` : null,
        label: "&laquo; Previous",
        active: false,
        page: skip > 1 ? skip * 1 - 1 : null
      }
    )
    for (var i = 1; i <= totalCount / take + 1; i++) {
      links.push({
        url: `/?page=${i}`,
        "label": i,
        "active": skip === i ?  true : false,
        "page": i
      })
    }
    links.push(
      {
        url: `/?page=${skip * 1 + 1}`,
        label: "Next &raquo;",
        active: false,
        page: skip * 1 + 1
      }
    )
    const payload = {
      pagination: {
          page: skip,
          first_page_url: `/?page=${skip}`,
          from: (skip - 1) * take + 1,
          last_page: Math.ceil(totalCount / take),
          links,
          next_page_url: `/?page=${skip + 1}`,
          items_per_page: take,
          prev_page_url: skip > 1 ? `/?page=${skip - 1}` : null,
          "to": skip * take,
          "total": totalCount
      }
    }

    return {
      data: users,
      payload
    }
  }

  async getCountries() {
    
    const countries = await this.usersRepository.createQueryBuilder('users')
      .select([
        "users.country"
      ])
      .distinct(true)
      .distinctOn(["users.country"])
      .getMany()

    return {
      data: countries
    }
  }
  
  // Dove add S@...
  async getUserInfo(userId) {
    
    const userInfo = await this.usersRepository.createQueryBuilder('users')
      .leftJoin('users.avatar','avatar')
      .select([
        "users.name",
        "users.firstname",
        "users.lastname",
        "users.email",
        "users.dob",
        "users.gender",
        "users.country",
        "users.premium",
        "users.avatarNumber",
        "users.phoneNumber",
        "avatar.url"
      ])
      .where("users.id = :userId", { userId })
      .getOne()

    return {
      data: userInfo
    }
  }

  async getUserTransactionHistory(userId, skip, take) {
    const totalCount = await this.recordsRepository.createQueryBuilder('records')
      .where("records.userId = :userId", { userId })
      .getCount();

    const userTransactionHistory = await this.recordsRepository.createQueryBuilder('records')
      .select([
        "records.title",
        "records.category",
        "records.duration",
        "records.likesCount",
        "records.reactionsCount",
        "records.emoji",
        "records.createdAt",
      ])
      .where("records.userId = :userId", { userId })
      .skip((skip * 1 - 1) * take)
      .take(take)
      .getMany()

    let links = [];
    links.push(
      {
        url: skip > 1 ? `/?page=${skip * 1 - 1}` : null,
        label: "&laquo; Previous",
        active: false,
        page: skip > 1 ? skip * 1 - 1 : null
      }
    )
    for (var i = 1; i <= totalCount / take + 1; i++) {
      links.push({
        url: `/?page=${i}`,
        "label": i,
        "active": skip === i ?  true : false,
        "page": i
      })
    }
    links.push(
      {
        url: `/?page=${skip * 1 + 1}`,
        label: "Next &raquo;",
        active: false,
        page: skip * 1 + 1
      }
    )
    const payload = {
      pagination: {
          page: skip,
          first_page_url: `/?page=${skip}`,
          from: (skip - 1) * take + 1,
          last_page: Math.ceil(totalCount / take),
          links,
          next_page_url: `/?page=${skip + 1}`,
          items_per_page: take,
          prev_page_url: skip > 1 ? `/?page=${skip - 1}` : null,
          "to": skip * take,
          "total": totalCount
      }
    }

    return {
      data: userTransactionHistory,
      payload
    }
  }

  async addSession(info){
    this.addHistory(info.id, HistoryTypeEnum.SESSION, null, info.sessionTime);
    await this.usersRepository.update(info.id, { totalSession: () => `"totalSession" + ${info.sessionTime}` });
  }

  async addOpenApp(user){
    this.addHistory(user.id, HistoryTypeEnum.OPEN_APP);
    await this.usersRepository.update(user.id, { openAppCount: () => '"openAppCount" + 1' });
  }

  async addHistory(userId, historyType, storyType = null, value = 0){
    const history = new HistoryEntity();
    history.user = userId;
    history.type = historyType;
    history.storyType = storyType;
    history.value = value;
    await this.historyRepository
      .createQueryBuilder()
      .insert()
      .into(HistoryEntity)
      .values(history)
      .execute();
  }
  
  async getOpenAppCount() {
    const total = await this.historyRepository.createQueryBuilder('history')
        .where("history.type = :type", { type: 'openApp' })
        .getCount();
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const history = await this.historyRepository.createQueryBuilder('history')
      .select([
        "history.id",   
        "history.createdAt"     
      ])
      .where("history.type = :type", { type: 'openApp' })
      .andWhere( 'history.createdAt >= :after', { after:  monthFirstDay})
      .andWhere('history.createdAt < :before', { before:  monthLastDay })
      .getMany()

    return {
      total,
      data: history
    }
  }

  async getPerSessionTime() {
    const total = await this.historyRepository.createQueryBuilder('history')
                    .select("SUM(history.value::numeric::integer)", "sum")
                    .where("history.type = :type", { type: 'session' }).getRawOne();
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const history = await this.historyRepository.createQueryBuilder('history')
      .select([
        "history.id",   
        "history.value",
        "history.createdAt"     
      ])
      .where("history.type = :type", { type: 'session' })
      .andWhere( 'history.createdAt >= :after', { after:  monthFirstDay})
      .andWhere('history.createdAt < :before', { before:  monthLastDay })
      .getMany()

    return {
      total: total.sum,
      data: history
    }
  }

  async getInviteLinks() {
    const total = await this.historyRepository.createQueryBuilder('history')
            .where("history.type = :type", { type: 'shareLink' })
            .getCount()
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const history = await this.historyRepository.createQueryBuilder('history')
      .select([
        "history.id",   
        "history.value",
        "history.createdAt"     
      ])
      .where("history.type = :type", { type: 'shareLink' })
      .andWhere( 'history.createdAt >= :after', { after:  monthFirstDay})
      .andWhere('history.createdAt < :before', { before:  monthLastDay })
      .getMany()

    return {
      total,
      data: history
    }
  }

  async getShareStories() {
    const total = await this.historyRepository.createQueryBuilder('history')
            .where("history.type = :type", { type: 'shareStory' })
            .getCount()
    var date = new Date();
    var monthFirstDay = new Date(date.getFullYear(), date.getMonth() , 1);
    var monthLastDay = new Date(date.getFullYear(), date.getMonth() + 1 , 1);
    const history = await this.historyRepository.createQueryBuilder('history')
      .select([
        "history.id",   
        "history.value",
        "history.createdAt"     
      ])
      .where("history.type = :type", { type: 'shareStory' })
      .andWhere( 'history.createdAt >= :after', { after:  monthFirstDay})
      .andWhere('history.createdAt < :before', { before:  monthLastDay })
      .getMany()

    return {
      total,
      data: history
    }
  }
  
}
