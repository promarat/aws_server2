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

@Injectable()
export class RecordsService {
  private readonly recordLimit: number;
  constructor(
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(LikesEntity) private likesRepository: Repository<LikesEntity>,
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

  async getRecordsByUser(userId, page, limit, order, user = null) {
    const paginate = paginationHelper(page, limit);
    const queryBuilder = this.recordsRepository.createQueryBuilder("records")
      .leftJoin("records.user", "user")
      .leftJoin("user.avatar", "avatar")
      .loadRelationCountAndMap("records.answersCount", "records.answers", "answers")
      .leftJoin("records.file", "file")
      .addSelect([
        "records.id",
        "records.title",
        "records.emoji",
        "records.duration",
        "records.colorType",
        "records.likesCount",
        "records.createdAt",
        "user.id",
        "user.pseudo",
        "user.avatar",
        "file.id",
        "file.link",
        "avatar.link"
      ]);

    if (user) {
      await queryBuilder.where({ user: user.id });
    }

    const records = await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      .offset(paginate.offset)
      .limit(paginate.getLimit)
      .getMany();
    const usersIds = records.filter((el) => el.user?.id !== userId).map((el) => el.user.id);
    const findFriends = usersIds.length ? await this.findFriendsByIds(usersIds, userId) : [];
    const recordIds = records.map((el) => el.id);
    const findAnswers = recordIds.length ? await this.getAnswersByRecordIds(recordIds) : [];
    const likes = recordIds.length ? await this.getRecordLikesByIds(recordIds) : [];

    return records.map((el) => {
      const findRecordLikes = filter(likes, (obj) => obj.record.id === el.id);
      const findUserLike = find(findRecordLikes, (obj) => obj.user.id === el.user.id);
      const findFriend = find(findFriends, (obj) => obj.friend.id === el.user.id);
      const filterAnswers = filter(findAnswers, (obj) => obj.record.id === el.id);
      const findAnswer = find(filterAnswers, (obj) => obj.user.id === el.user.id);
      return {
        ...el,
        isLiked: !!findUserLike,
        isMine: userId === el.user.id,
        friend: findFriend ? findFriend.status : userId === el.user.id ? null : "not invited",
        isAnswered: !!findAnswer
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

  getRecordLikesByIds(ids): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.record", "record", "record.id in (:...ids)", { ids })
      .leftJoin("likes.user", "user")
      .select([
        "likes.id",
        "user.id",
        "record.id"
      ])
      .getMany();
  }

  getAnswerLikesByIds(ids): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.answer", "answer", "answer.id in (:...ids)", { ids })
      .leftJoin("likes.user", "user")
      .select([
        "likes.id",
        "user.id",
        "answer.id"
      ])
      .getMany();
  }

  async getAnswersByRecord(id, page, limit, order, user) {
    const paginate = paginationHelper(page, limit);
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
      .addSelect([
        "answers.id",
        "answers.duration",
        "answers.likesCount",
        "answers.createdAt",
        "user.id",
        "user.pseudo",
        "user.avatar",
        "file.id",
        "file.link",
        "avatar.link"
      ]);
    const answers = await queryBuilder
      .orderBy("answers.createdAt", order.toUpperCase())
      .offset(paginate.offset)
      .limit(paginate.getLimit)
      .getMany();
    const answerIds = answers.map((el) => el.id);
    const likes = answerIds.length ? await this.getAnswerLikesByIds(answerIds) : [];
    return answers.map((el) => {
      const findAnswerLikes = filter(likes, (obj) => obj.answer.id === el.id);
      const findUserLike = find(findAnswerLikes, (obj) => obj.user.id === el.user.id);
      return {
        ...el,
        isLiked: findUserLike ? true : false,
        isMine: el.user.id === user.id
      };
    });
  }

  async addRecord(body: RecordDto, user, buffer, filename) {
    const findUser = await this.usersService.getById(user.id);
    const todayLimit = await this.getTodayRecordCount(user);

    if (todayLimit >= this.recordLimit) {
      throw new BadRequestException("limit for today is exhausted");
    }

    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const rand = Math.floor(Math.random() * (3));
    const entity = new RecordsEntity();
    entity.title = body.title;
    entity.emoji = body.emoji;
    entity.duration = body.duration;
    entity.file = uploadFile;
    entity.user = findUser;
    entity.colorType = rand;
    return this.recordsRepository.save(entity);
  }

}
