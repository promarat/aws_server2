import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { RecordsEntity } from "../entities/records.entity";
import { Repository } from "typeorm";
import { FileService } from "../files/file.service";
import { UsersService } from "../users/users.service";
import { RecordDto } from "./dto/record.dto";
import { AnswersEntity } from "../entities/answers.entity";
import { paginationHelper } from "../lib/helpers";
import { LikesEntity } from "../entities/llikes.entity";
import { filter, find } from "lodash";
import { FriendsEntity } from "../entities/friends.entity";
import { FileTypeEnum } from "../lib/enum";
import { ServeralCountResponse } from "./dto/records.response";
import { UsersEntity } from "src/entities/users.entity";
import { ReactionsEntity } from "src/entities/reaction.entity";

@Injectable()
export class RecordsService {
  private readonly recordLimit: number;
  constructor(
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(LikesEntity) private likesRepository: Repository<LikesEntity>,
    @InjectRepository(ReactionsEntity) private reactionsRepository: Repository<ReactionsEntity>,
    @InjectRepository(FriendsEntity) private friendsRepository: Repository<FriendsEntity>,
    private readonly filesService: FileService,
    private readonly usersService: UsersService
  ) {
    this.recordLimit = 5;
  }

  async getTodayCount(user) {
    const getRecordQuery = this.recordsRepository.createQueryBuilder("records")
      .where({ user: user.id })
      .where("DATE(records.createdAt) = CURRENT_DATE")
      .getCount();
    const getAnswerQuery = this.answersRepository.createQueryBuilder("answers")
      .where({ user: user.id })
      .where("DATE(answers.createdAt) = CURRENT_DATE")
      .getCount();
    const [getRecordCount, getAnswerCount] = await Promise.all([getRecordQuery, getAnswerQuery]);
    return {
      todayRecordCount: Number(getRecordCount),
      leftRecordCount: Number(getRecordCount) ? this.recordLimit - Number(getRecordCount) : this.recordLimit,
      answerCount: Number(getAnswerCount)
    };
  }

  getTodayRecordCount(user) {
    return this.recordsRepository.createQueryBuilder("records")
      .where({ user: user.id })
      .where("DATE(records.createdAt) = CURRENT_DATE")
      .getCount();
  }

  async getRecordstitle(userId, skip, take, order, category = "", search = "") {
    // const paginate = paginationHelper(page, limit);
    const queryBuilder = this.recordsRepository.createQueryBuilder("records")
      .select([
        "records.title",
      ])
      .where("1=1")
      ;
    
    if (category != "")    
      await queryBuilder.andWhere({ category: category })

    if (search != "")
      await queryBuilder.andWhere("records.title ILIKE :titlesearch", {titlesearch: '' + search + '%'})

    const records = await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      .skip(skip)
      .take(take)
      .getMany();

    return records;
  }

  async getRecordsByUser(me, skip, take, order, user = "", category = "", search = "") {
    // if (user != "" && me != user) {
    //   const { count } = await this.friendsRepository
    //   .createQueryBuilder('friends')
    //   .where("friends.userId = :id", {id: me})
    //   .andWhere("friends.friendId = :fid", {fid: user})
    //   .andWhere("friends.status = :status", {status: "accepted"})
    //   .select([
    //     'COUNT(friends.id)'
    //   ]).getRawOne();

    //   const otheruser = await this.usersService.getById(user);
    //   if (!otheruser) {
    //     throw new NotFoundException();
    //   }
      
    //   if ( otheruser.isPrivate && count == 0 ) {
    //     throw new BadRequestException("This account is private");
    //   }
    // }

    // const paginate = paginationHelper(page, limit);
    const queryBuilder = this.recordsRepository.createQueryBuilder("records")
      .leftJoin("records.user", "user")
      .leftJoin("user.avatar", "avatar")
      .loadRelationCountAndMap("records.answersCount", "records.answers", "answers")
      .leftJoin("records.file", "file")
      .select([
        "records.id",
        "records.title",
        "records.emoji",
        "records.duration",
        "records.colorType",
        "records.likesCount",
        "records.reactionsCount",
        "records.createdAt",
        "user.id",
        "user.pseudo",
        "user.avatar",
        "user.name",
        "user.premium",
        "file.id",
        "file.url",
        "avatar.url"
      ])
      .where("1=1")
      ;

    if (user != "") {
      await queryBuilder.andWhere({ user: user });
    }

    if (category != "")    
      await queryBuilder.andWhere({ category: category })
    
    if (search != "")
      await queryBuilder.andWhere("records.title ILIKE :titlesearch", {titlesearch: '' + search + '%'})

    const records = await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      .skip(skip)
      .take(take)
      .getMany();
    // const usersIds = records.filter((el) => el.user?.id !== userId).map((el) => el.user.id); console.log(usersIds);
    // const findFriends = usersIds.length ? await this.findFriendsByIds(usersIds, userId) : [];
    const recordIds = records.map((el) => el.id);
    // const findAnswers = recordIds.length ? await this.getAnswersByRecordIds(recordIds) : [];
    // const likes = recordIds.length ? await this.getRecordLikesById(recordIds) : [];
    const likes = recordIds.length ? await this.getRecordLikesByIds(recordIds, me) : [];
    const recordreactions = recordIds.length ? await this.getReactionsByIds(recordIds) : [];
    return records.map((el) => {
      // const findRecordLikes = filter(likes, (obj) => obj.record.id === el.id);console.log("i--like---", findRecordLikes);
      // const findUserLike = find(findRecordLikes, (obj) => obj.user.id === el.user.id);
      // const findFriend = find(findFriends, (obj) => obj.friend.id === el.user.id);
      // const filterAnswers = filter(findAnswers, (obj) => obj.record.id === el.id);
      // const findAnswer = find(filterAnswers, (obj) => obj.user.id === el.user.id);
      const findlikes = filter(likes, (obj) => obj.record.id === el.id);
      const findReactions = filter(recordreactions, (obj) => obj.record.id === el.id);
      const myReactions = filter(findReactions, (obj) => obj.user.id === me);
      return {
        ...el,
        islike: findlikes && findlikes.length > 0 ? true : false,
        reactions: findReactions && findReactions.length > 3? findReactions.slice(0, 3) : (findReactions ?  findReactions : []),
        isreaction: myReactions && myReactions.length > 0 ? true : false,
        isMine: me === el.user.id,
        // friend: findFriend ? findFriend.status : userId === el.user.id ? null : "not invited",
        // isAnswered: !!findAnswer
      };
    });
  }

  getAnswersByRecordIds(ids) {
    return this.answersRepository.createQueryBuilder("answers")
      .innerJoin("answers.record", "record", "record.id in (:...ids)", { ids })
      .leftJoin("answers.user", "user")
      .select([
        "answers.id",
        "record.id",
        "user.id"
      ])
      .getMany();
  }

  findFriendsByIds(ids, userId) {
    return this.friendsRepository
      .createQueryBuilder("friends")
      .where({ user: userId })
      .innerJoin("friends.friend", "friend", "friend.id in (:...ids)", { ids })
      .select([
        "friends.id",
        "friends.status",
        "friend.id"
      ])
      .getMany();
  }

  getRecordLikesById(ids): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.record", "record", "record.id in (:...ids)", { ids })
      .select([
        "likes.emoji",
      ])
      // .orderBy("likes.createdAt", "DESC")
      // .offset(0)
      // .limit(3)
      .getMany();
  }

  getRecordLikesByIds(ids, userId): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.record", "record", "record.id in (:...ids)", { ids })
      .leftJoin("likes.user", "user")
      .where({ user: userId })
      .select([
        "likes.emoji",
        "user.id",
        "record.id"
      ])
      .getMany();
  }

  getReactionsByIds(ids): Promise<ReactionsEntity[]> {
    return this.reactionsRepository
      .createQueryBuilder("reactions")
      .innerJoin("reactions.record", "record", "record.id in (:...ids)", { ids })
      .leftJoin("reactions.user", "user")
      .select([
        "reactions.emoji",
        "user.id",
        "record.id"
      ])
      .orderBy("reactions.createdAt", "DESC")
      .getMany();
  }

  getAnswerLikesByIds(ids, userId): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.answer", "answer", "answer.id in (:...ids)", { ids })
      .leftJoin("likes.user", "user")
      .where({ user: userId })
      .select([
        "likes.id",
        "user.id",
        "answer.id"
      ])
      .getMany();
  }

  async getAnswersByRecord(id, skip, take, order, user) {
    // const paginate = paginationHelper(page, limit);
    const findRecord = await this.recordsRepository.findOne({ where: { id } });
    if (!findRecord) {
      throw new NotFoundException();
    }
    const queryBuilder = this.answersRepository
      .createQueryBuilder("answers")
      .where({ record: findRecord.id })
      .leftJoin("answers.user", "user")
      .leftJoin("user.avatar", "avatar")
      .leftJoin("answers.file", "file")
      .select([
        "answers.id",
        "answers.duration",
        "answers.likesCount",
        "answers.emoji",
        "answers.createdAt",
        "user.id",
        "user.name",
        "user.pseudo",
        "user.avatar",
        "file.id",
        "file.link",
        "file.url",
        "avatar.link",
        "avatar.url"
      ]);
    const answers = await queryBuilder
      .orderBy("answers.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      .skip(skip)
      .take(take)
      .getMany();
    const answerIds = answers.map((el) => el.id);
    const likes = answerIds.length ? await this.getAnswerLikesByIds(answerIds, user.id) : [];
    return answers.map((el) => {
      const findAnswerLikes = filter(likes, (obj) => obj.answer.id === el.id);
      // const findUserLike = find(findAnswerLikes, (obj) => obj.user.id === el.user.id);
      return {
        ...el,
        isLiked: findAnswerLikes && findAnswerLikes.length > 0 ? true : false,
        isMine: el.user.id === user.id
      };
    });
  }

  async addRecord(body: RecordDto, user, buffer, filename) {
    const findUser = await this.usersService.getById(user.id);
    // const todayLimit = await this.getTodayRecordCount(user);

    // if (todayLimit >= this.recordLimit) {
    //   throw new BadRequestException("limit for today is exhausted");
    // }

    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const rand = Math.floor(Math.random() * (3));
    const entity = new RecordsEntity();
    entity.title = body.title;
    entity.emoji = body.emoji;
    entity.duration = body.duration;
    entity.file = uploadFile;
    entity.user = findUser;
    entity.colorType = rand;
    entity.privacy = body.privacy;
    entity.category = body.category;

    return this.recordsRepository.save(entity);
  }

  async updateRecord(body: RecordDto, user, buffer, filename) {
    const findRecord = await this.recordsRepository.findOne({ where: { id: body.id, user:user.id } });
    if (!findRecord) {
      throw new NotFoundException();
    }

    const findUser = await this.usersService.getById(user.id);
    // const todayLimit = await this.getTodayRecordCount(user);

    // if (todayLimit >= this.recordLimit) {
    //   throw new BadRequestException("limit for today is exhausted");
    // }

    console.log(findRecord);

    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const rand = Math.floor(Math.random() * (3));
    findRecord.title = body.title;
    findRecord.emoji = body.emoji;
    findRecord.duration = body.duration;
    findRecord.file = uploadFile;
    findRecord.user = findUser;
    findRecord.colorType = rand;
    findRecord.privacy = body.privacy;
    findRecord.category = body.category;

    return this.recordsRepository.save(findRecord);
  }

  async getSeveralCounts(user, other = ""): Promise<any> {
    var userid = user.id;
    if (other != "") {
      userid = other;
    }

    const voicecount = await this.recordsRepository
    .createQueryBuilder('records')
    .where("records.userId = :id", {id: userid})
    .select([
      'COUNT(records.id)'
    ]).getRawOne();

    const followers  = await this.friendsRepository
    .createQueryBuilder('friends')
    .where("friends.friendId = :id", {id: userid})
    .andWhere("friends.status = :status", {status: "accepted"})
    .select([
      'COUNT(friends.id)'
    ]).getRawOne();
    
    const followings = await this.friendsRepository
    .createQueryBuilder('friends')
    .where("friends.userId = :id", {id: userid})
    .andWhere("friends.status = :status", {status: "accepted"})
    .select([
      'COUNT(friends.id)'
    ]).getRawOne();
    
    const findUser = await this.usersService.getById(userid);

    let idFriend = null;
    if (other != "") {
      const existFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: other } });
      // if (existFriend) {
        idFriend = existFriend;
      // }
    }

    const severalcount: any = {
      voices: voicecount,
      followers: followers,
      followings: followings,
      user: findUser,
      isFriend: idFriend
    };
    console.log("severalcount--", severalcount);
    return severalcount;
  }

  async getTotalRecord() {
    return {
      count: await this.recordsRepository.count()
    }
  }

  async getRecordSeconds() {
    return {
      total: await this.recordsRepository.createQueryBuilder("records")
      .select("SUM(records.duration::numeric::integer)", "sum")
      .getRawOne()
    }
  }

  async getTotalFriendRequest() {
    return {
      count: await this.friendsRepository.count({where: {status: "accepted"}})
    }
  }

  async getTotalInteraction() {
    const recordCount = await this.recordsRepository.count();

    const reactionsCount = await this.recordsRepository.createQueryBuilder("records")
      .select("SUM(records.reactionsCount)", "sum")
      .getRawOne()

    const answersCount = await this.answersRepository.count();
        
    return {
      count: recordCount + parseInt(reactionsCount.sum) + answersCount
    }
  }
}
