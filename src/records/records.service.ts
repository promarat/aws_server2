import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectConnection, InjectRepository } from "@nestjs/typeorm";
import { RecordsEntity } from "../entities/records.entity";
import { Connection, Repository, In, Not } from "typeorm";
import { FileService } from "../files/file.service";
import { UsersService } from "../users/users.service";
import { RecordDto } from "./dto/record.dto";
import { RecordDataDto } from "./dto/record.profile";
import { AnswersEntity } from "../entities/answers.entity";
import { MailsService } from "../mail/mail.service";
import { paginationHelper } from "../lib/helpers";
import { LikesEntity, LikeTypeEnum } from "../entities/llikes.entity";
import { filter, find } from "lodash";
import { FriendsEntity } from "../entities/friends.entity";
import { FileTypeEnum, StoryTypeEnum } from "../lib/enum";
import { ServeralCountResponse } from "./dto/records.response";
import { UsersEntity } from "src/entities/users.entity";
import { ReactionsEntity } from "src/entities/reaction.entity";
import e from "express";
import { ReplyAnswersEntity } from "src/entities/reply-answer.entity";
import { HistoryEntity, HistoryTypeEnum } from "src/entities/history.entity";
import { FriendsStatusEnum } from "src/admin/lib/enum";

@Injectable()
export class RecordsService {
  private readonly recordLimit: number;
  constructor(

    @InjectConnection() private readonly connection: Connection,
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(ReplyAnswersEntity) private replyAnswersRepository: Repository<ReplyAnswersEntity>,
    @InjectRepository(LikesEntity) private likesRepository: Repository<LikesEntity>,
    @InjectRepository(ReactionsEntity) private reactionsRepository: Repository<ReactionsEntity>,
    @InjectRepository(FriendsEntity) private friendsRepository: Repository<FriendsEntity>,
    // private mailService: MailsService,
    private readonly filesService: FileService,
    private readonly usersService: UsersService,
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
      .leftJoin("records.user", "user")
      .select([
        "records.id",
        "records.title",
        "records.privacy",
        "records.temporary",
        "user.id",
        "user.isPrivate"
      ])
      .where("1=1")
      ;

    if (category != "")
      await queryBuilder.andWhere({ category: category })

    if (search != "")
      await queryBuilder.andWhere("records.title ILIKE :titlesearch", { titlesearch: '%' + search + '%' })

    const records = await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      // .skip(skip)
      // .take(take)
      .getMany();
    const usersIds = records.filter((el) => el.user?.id !== userId).map((el) => el.user.id);
    const findFriends = usersIds.length ? await this.findFriendsByIds(usersIds, userId) : [];
    const Records = records.filter((el) => {
      const findFriend = find(findFriends, (obj) => obj.friend.id === el.user.id);
      if (findFriend && findFriend.status == 'blocked')
        return false;
      if (el.user.id == userId)
        return true;
      if (el.user.isPrivate == true || (el.temporary == false && el.privacy == true)) {
        if (findFriend && findFriend.status == 'accepted')
          return true;
        else return false;
      }
      return true;
    })
    const userQueryBuilder = this.usersRepository.createQueryBuilder("users")
      .leftJoin('users.avatar', 'avatar')
      .select([
        "users.id",
        "users.name",
        "users.avatarNumber",
        "users.phoneNumber",
        "avatar.url"
      ]);


    if (search != "")
      await userQueryBuilder.where("users.name ILIKE :titlesearch", { titlesearch: '%' + search + '%' })
    const users = await userQueryBuilder
      .orderBy("users.name")
      .getMany();
    return { record: Records, user: users };
  }

  async getRecordsByUser(me, skip, take, order, user = "", category = "", search = "", recordId = "", friend = "") {
    const queryBuilder = this.recordsRepository.createQueryBuilder("records")
      .leftJoin("records.user", "user")
      .leftJoin("user.avatar", "avatar")
      .loadRelationCountAndMap("records.answersCount", "records.answers", "answers")
      .leftJoin("records.file", "file")
      .select([
        "records.id",
        "records.title",
        "records.emoji",
        "records.category",
        "records.duration",
        "records.colorType",
        "records.privacy",
        "records.temporary",
        "records.likesCount",
        "records.listenCount",
        "records.createdAt",
        "user.id",
        "user.pseudo",
        "user.avatar",
        "user.name",
        "user.premium",
        "user.avatarNumber",
        "user.phoneNumber",
        "user.isPrivate",
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
      await queryBuilder.andWhere("records.title ILIKE :titlesearch", { titlesearch: '%' + search + '%' })

    if (recordId != "") {
      await queryBuilder.andWhere({ id: recordId });
    }

    if (search == "" && recordId == "") await queryBuilder.andWhere({ temporary: false });

    if (friend == 'friend') {
      const followers = await this.friendsRepository
        .createQueryBuilder('friends')
        .leftJoin("friends.friend", "friend")
        .leftJoin("friends.user", "user")
        .select([
          "friends.id",
          "friend.id",
        ])
        .where({ status: "accepted" })
        .andWhere({ user: me })
        .getMany();
      const friends = followers.map((item) => item.friend.id);
      await queryBuilder.andWhere({ user: In(friends) })
    }

    const mainRecords = await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      .skip(skip)
      .take(take)
      .getMany();
    const usersIds = mainRecords.filter((el) => el.user?.id !== me).map((el) => el.user.id);
    const findFriends = usersIds.length ? await this.findFriendsByIds(usersIds, me) : [];
    const records = mainRecords.filter((el) => {
      const findFriend = find(findFriends, (obj) => obj.friend.id === el.user.id);
      if (findFriend && findFriend.status == 'blocked')
        return false;
      if (el.user.id == me)
        return true;
      if (el.user.isPrivate == true || (el.temporary == false && el.privacy == true)) {
        if (findFriend && findFriend.status == 'accepted')
          return true;
        else return false;
      }
      return true;
    })
    const recordIds = records.map((el) => el.id);
    const likes = recordIds.length ? await this.getRecordLikesByIds(recordIds, me) : [];
    //const recordreactions = recordIds.length ? await this.getReactionsByIds(recordIds) : [];

    return records.map((el) => {
      const findlikes = filter(likes, (obj) => obj.record.id === el.id);
      //const findReactions = filter(recordreactions, (obj) => obj.record.id === el.id);
      //const myReactions = filter(findReactions, (obj) => obj.user.id === me);
      return {
        ...el,
        isLike: findlikes && findlikes.length > 0 && findlikes[0].isLike == true ? true : false,
        //reactions: findReactions && findReactions.length > 3? findReactions.slice(0, 3) : (findReactions ?  findReactions : []),
        //isreaction: myReactions && myReactions.length > 0 ? true : false,
        isMine: me === el.user.id,
      };
    });
  }
  async getTemporariesByUser(me, skip, take, order, userId = "") {
    const queryBuilder = this.recordsRepository.createQueryBuilder("records")
      .leftJoin("records.user", "user")
      .leftJoin("user.avatar", "avatar")
      .loadRelationCountAndMap("records.answersCount", "records.answers", "answers")
      .leftJoin("records.file", "file")
      .select([
        "records.id",
        "records.title",
        "records.emoji",
        "records.category",
        "records.duration",
        "records.colorType",
        "records.privacy",
        "records.temporary",
        "records.likesCount",
        "records.createdAt",
        "user.id",
        "user.pseudo",
        "user.avatar",
        "user.name",
        "user.isPrivate",
        "user.premium",
        "user.avatarNumber",
        "user.phoneNumber",
        "file.id",
        "file.url",
        "avatar.url"
      ])
      .where({ temporary: true })
      ;
    if (userId != "") {
      await queryBuilder.andWhere({ user: userId });
    }
    var date = new Date();
    date.setDate(date.getDate() - 1);
    await queryBuilder.andWhere("records.createdAt > :limitTime", { limitTime: date })
    const temRecords = await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      .getMany();
    const usersIds = temRecords.map((el) => el.user.id);
    const findFriends = usersIds.length ? await this.findFriendsByIds(usersIds, me) : [];
    const Records = temRecords.filter((el) => {
      const findFriend = find(findFriends, (obj) => obj.friend.id === el.user.id);
      if (findFriend && findFriend.status == 'blocked')
        return false;
      if (el.user.id == me)
        return true;
      if (el.user.isPrivate == true) {
        if (findFriend && findFriend.status == 'accepted')
          return true;
        else return false;
      }
      return true;
    })
    const recordIds = Records.map((el) => el.id);
    const likes = recordIds.length ? await this.getRecordLikesByIds(recordIds, me) : [];

    return Records.map((el) => {
      const findFriend = find(findFriends, (obj) => obj.friend.id === el.user.id);
      const findLikes = filter(likes, (obj) => obj.record.id === el.id);
      let isFriend = false;
      if (findFriend && findFriend.status == 'accepted') isFriend = true;
      return {
        ...el,
        isLike: findLikes && findLikes.length > 0 && findLikes[0].isLike == true ? true : false,
        isMine: me === el.user.id,
        isFriend: isFriend
      };
    });
  }

  async getRecordsByAdmin(skip, take, order, user = "", category = "", search = "", recordId = "") {
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
        "records.privacy",
        "records.temporary",
        "records.likesCount",
        "records.reactionsCount",
        "records.listenCount",
        "records.createdAt",
        "user.id",
        "user.pseudo",
        "user.avatar",
        "user.name",
        "user.premium",
        "user.avatarNumber",
        "user.phoneNumber",
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
      await queryBuilder.andWhere("records.title ILIKE :titlesearch", { titlesearch: '%' + search + '%' })

    if (recordId != "") {
      await queryBuilder.andWhere({ id: recordId });
    }

    if (search == "") await queryBuilder.andWhere({ temporary: false });

    return await queryBuilder
      .orderBy("records.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      .skip(skip)
      .take(take)
      .getMany();
  }

  async getRecords_ByUser() {
    const userData = await this.connection.query('SELECT "user"."email" AS "user_email", "user"."name" AS "user_name", "user"."id" AS "user_id", SUM("records"."likesCount") AS likes_sum, sum("records"."reactionsCount") as reaction_sum FROM "records" "records" LEFT JOIN "users" "user" ON "user"."id"="records"."userId" GROUP BY "user"."id" ORDER BY "likes_sum" DESC LIMIT 7');
    const data = await Promise.all(userData.map(async (user) => {
      return {
        ...user,
        record: await this.recordsRepository.createQueryBuilder("records")
          .select(["records.category", "records.createdAt"])
          .where({ user: user.user_id })
          .orderBy("records.createdAt", "DESC")
          .getOne()
      }
    }));
    return {
      data
    }
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

  findUsersByFriendId(friendId) {
    return this.friendsRepository
      .createQueryBuilder("friends")
      .where({ friend: friendId })
      .innerJoin("friends.user", "user")
      .select([
        "friends.id",
        "friends.status",
        "user.id",
        "user.email"
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
        "likes.isLike",
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
      .select([
        "likes.id",
        "likes.isLike",
        "user.id",
        "answer.id"
      ])
      .where({ user: userId })
      .andWhere({ isLike: true })
      .getMany();
  }

  getReplyAnswerLikesByIds(ids, userId): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.replyAnswer", "replyAnswer", "replyAnswer.id in (:...ids)", { ids })
      .leftJoin("likes.user", "user")
      .select([
        "likes.id",
        "likes.isLike",
        "user.id",
        "replyAnswer.id"
      ])
      .where({ user: userId })
      .andWhere({ isLike: true })
      .getMany();
  }

  async getFollowUsers(userId, other, followType) {
    if (followType == 'Following') {
      const followings = await this.friendsRepository
        .createQueryBuilder('friends')
        .leftJoin("friends.friend", "friend")
        .leftJoin("friends.user", "user")
        .leftJoin('friend.avatar', 'avatar')
        .select([
          "friends.id",
          "friends.invite",
          "friend.id",
          "friend.name",
          "friend.firstname",
          "friend.lastname",
          "friend.premium",
          "friend.avatarNumber",
          "friend.phoneNumber",
          "avatar.url"
        ])
        .where({ status: "accepted" })
        .andWhere({ user: other })
        .orderBy("friend.name", 'ASC')
        .getMany();
      return followings.map((item, index) => {
        return {
          user: {
            id: item.friend.id,
            name: item.friend.name,
            invite: item.invite,
            premium: item.friend.premium,
            avatarNumber: item.friend.avatarNumber,
            phoneNumber: item.friend.phoneNumber,
            avatar: item.friend.avatar ? { url: item.friend.avatar.url } : null
          }
        }
      })
    }

    if (followType == 'Followers') {
      return await this.friendsRepository
        .createQueryBuilder('friends')
        .leftJoin("friends.user", "user")
        .leftJoin("friends.friend", "friend")
        .leftJoin('user.avatar', 'avatar')
        .select([
          "friends.id",
          "friends.invite",
          "user.id",
          "user.name",
          "user.firstname",
          "user.lastname",
          "user.premium",
          "user.avatarNumber",
          "user.phoneNumber",
          "avatar.url"
        ])
        .where({ status: "accepted" })
        .andWhere({ friend: other })
        .orderBy("user.name", 'ASC')
        .getMany();
    }
  }

  async getInviteUsers(userId) {
    const invites = await this.friendsRepository
      .createQueryBuilder('friends')
      .leftJoin("friends.friend", "friend")
      .select([
        "friends.id",
        "friend.id",
      ])
      .where({ invite: true })
      .andWhere({ user: userId })
      .getMany();
    return invites.map((item) => item.friend.id);
  }

  async getSuggestUsers(userId, skip) {
    const followings = await this.friendsRepository
      .createQueryBuilder('friends')
      .leftJoin("friends.friend", "friend")
      .select([
        "friends.id",
        "friend.id",
      ])
      .where({ status: FriendsStatusEnum.ACCEPTED })
      .andWhere({ user: userId })
      .getMany();
    const relations = await this.friendsRepository
      .createQueryBuilder('friends')
      .leftJoin("friends.friend", "friend")
      .select([
        "friends.id",
        "friend.id",
      ])
      .where({ status: FriendsStatusEnum.PENDING, user: userId })
      .orWhere({ status: FriendsStatusEnum.ACCEPTED, user: userId })
      .orWhere({ suggest: false, user: userId })
      .getMany();
    const followingIds = followings.map((item) => item.friend.id);
    const relationIds = relations.map((item) => item.friend.id);
    const suggests = await this.friendsRepository
      .createQueryBuilder('friends')
      .leftJoin("friends.friend", "friend")
      .leftJoin("friends.user", "user")
      .leftJoin('friend.avatar', 'avatar')
      .select([
        "friends.id",
        "friend.id",
        "friend.name",
        "friend.firstname",
        "friend.lastname",
        "friend.premium",
        "friend.avatarNumber",
        "friend.phoneNumber",
        "avatar.url"
      ])
      .where({ status: "accepted" })
      .andWhere({ user: In(followingIds) })
      .andWhere({ friend: Not(In(relationIds)) })
      .andWhere({ friend: Not(userId) })
      .skip(skip)
      .take(10)
      .getMany();
    let arr = suggests.map((item) => {
      return {
        user: {
          id: item.friend.id,
          name: item.friend.name,
          premium: item.friend.premium,
          avatarNumber: item.friend.avatarNumber,
          phoneNumber: item.friend.phoneNumber,
          avatar: item.friend.avatar ? { url: item.friend.avatar.url } : null
        }
      }
    })
    let result = arr.reduce((unique, o) => {
      if (!unique.some(obj => obj.user.id === o.user.id)) {
        unique.push(o);
      }
      return unique;
    }, []);
    return result;
  }

  async getStoryLikes(userId, storyId, storyType) {
    const queryBuilder = this.likesRepository.createQueryBuilder("likes")
      .leftJoin("likes.user", "user")
      .leftJoin('user.avatar', 'avatar')
      .leftJoin("likes.record", "record")
      .leftJoin("likes.answer", "answer")
      .leftJoin("likes.replyAnswer", "replyAnswer")
      .select([
        "likes.isLike",
        "record.id",
        "answer.id",
        "replyAnswer.id",
        "user.id",
        "user.name",
        "user.premium",
        "user.avatarNumber",
        "user.phoneNumber",
        "avatar.url"
      ])
      .where({ isLike: true })
      ;
    if (storyType == LikeTypeEnum.RECORD) {
      await queryBuilder.andWhere({ record: storyId });
    }
    else if (storyType == LikeTypeEnum.ANSWER) {
      await queryBuilder.andWhere({ answer: storyId });
    }
    else if (storyType == LikeTypeEnum.REPLY_ANSWER) {
      await queryBuilder.andWhere({ replyAnswer: storyId });
    }
    return await queryBuilder.getMany();
  }

  async getAnswersByRecord(id, skip, take, order, user, answerId) {
    //const paginate = paginationHelper(page, limit);
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
        "user.avatarNumber",
        "user.phoneNumber",
        "file.id",
        "file.link",
        "file.url",
        "avatar.link",
        "avatar.url"
      ]);
    const tpQueryBuilder = queryBuilder.clone();
    let answers = await queryBuilder
      .orderBy("answers.likesCount", "DESC")
      .addOrderBy("answers.createdAt", order.toUpperCase())
      // .offset(paginate.offset)
      // .limit(paginate.getLimit)
      // .skip(skip)
      // .take(take)
      .getMany();
    if (answerId != '') {
      const spAnswer = await tpQueryBuilder.where({ id: answerId }).getOne();
      answers.unshift(spAnswer);
    }
    const answerIds = answers.map((el) => el.id);
    const likes = answerIds.length ? await this.getAnswerLikesByIds(answerIds, user.id) : [];
    return answers.map((el, index) => {
      const findUserLike = find(likes, (obj) => (obj.answer.id === el.id));
      return {
        ...el,
        isLiked: findUserLike ? true : false,
        isMine: el.user.id === user.id
      };
    });
  }

  async getReplyAnswersByAnswer(id, skip, take, order, user) {
    const findAnswer = await this.answersRepository.findOne({ where: { id } });
    if (!findAnswer) {
      throw new NotFoundException();
    }
    const queryBuilder = this.replyAnswersRepository
      .createQueryBuilder("replyAnswers")
      .where({ answer: id })
      .leftJoin("replyAnswers.user", "user")
      .leftJoin("user.avatar", "avatar")
      .leftJoin("replyAnswers.file", "file")
      .select([
        "replyAnswers.id",
        "replyAnswers.duration",
        "replyAnswers.likesCount",
        "replyAnswers.createdAt",
        "user.id",
        "user.name",
        "user.pseudo",
        "user.avatarNumber",
        "user.phoneNumber",
        "file.id",
        "file.link",
        "file.url",
        "avatar.link",
        "avatar.url"
      ]);
    let replyAnswers = await queryBuilder
      .orderBy("replyAnswers.likesCount", "DESC")
      .addOrderBy("replyAnswers.createdAt", order.toUpperCase())
      .getMany();
    const answerIds = replyAnswers.map((el) => el.id);
    const likes = answerIds.length ? await this.getReplyAnswerLikesByIds(answerIds, user.id) : [];
    return replyAnswers.map((el, index) => {
      const findUserLike = find(likes, (obj) => (obj.replyAnswer.id === el.id));
      return {
        ...el,
        isLiked: findUserLike ? true : false,
        isMine: el.user.id === user.id
      };
    });
  }

  async changeVoiceProfile(user, body: RecordDataDto) {
    const findRecord = await this.recordsRepository.findOne({ where: { id: body.id }, relations: ["user"] });
    if (user.id != findRecord.user.id) {
      throw new BadRequestException("This story is not yours");
    }
    findRecord.title = body.title;
    findRecord.emoji = body.emoji;
    findRecord.category = body.category;
    findRecord.privacy = body.privacy;
    findRecord.temporary = body.temporary;
    return this.recordsRepository.save(findRecord);
  }

  async addRecord(body: RecordDto, user, buffer, filename) {
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
    entity.user = user;
    entity.colorType = rand;
    entity.privacy = body.privacy;
    entity.temporary = body.temporary;
    entity.category = body.category;
    //this.mailService.sentNotifyToFriends(user.id,`Discover the new story of ${findUser.name}`,{nav:"Feed",params:{}});
    return this.recordsRepository.save(entity);
  }

  async updateRecord(body: RecordDto, user, buffer, filename) {
    const findRecord = await this.recordsRepository.findOne({ where: { id: body.id, user: user.id } });
    if (!findRecord) {
      throw new NotFoundException();
    }

    // const todayLimit = await this.getTodayRecordCount(user);

    // if (todayLimit >= this.recordLimit) {
    //   throw new BadRequestException("limit for today is exhausted");
    // }

    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const rand = Math.floor(Math.random() * (3));
    findRecord.title = body.title;
    findRecord.emoji = body.emoji;
    findRecord.duration = body.duration;
    findRecord.file = uploadFile;
    findRecord.user = user;
    findRecord.colorType = rand;
    findRecord.privacy = body.privacy;
    findRecord.category = body.category;

    return this.recordsRepository.save(findRecord);
  }

  async getSeveralCounts(user, other = ""): Promise<any> {
    var userId = user.id;
    if (other != "") {
      userId = other;
    }

    const voicecount = await this.recordsRepository
      .createQueryBuilder('records')
      .where("records.userId = :id", { id: userId })
      .select([
        'COUNT(records.id)'
      ]).getRawOne();

    const followers = await this.friendsRepository
      .createQueryBuilder('friends')
      .where("friends.status = :status", { status: "accepted" })
      .andWhere("friends.friendId = :id", { id: userId })
      .select([
        'COUNT(friends.id)'
      ]).getRawOne();

    // const followings = await this.friendsRepository
    //   .createQueryBuilder('friends')
    //   .where("friends.status = :status", { status: "accepted" })
    //   .andWhere("friends.userId = :id", { id: userid })
    //   .select([
    //     'COUNT(friends.id)'
    //   ]).getRawOne();

    const likes = await this.recordsRepository
      .createQueryBuilder("records")
      .leftJoin("records.user", "user")
      .where({ user: userId })
      .select([
        'SUM(records.likesCount)'
      ]).getRawOne();

    const findUser = await this.usersService.getById(userId);

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
      //followings: followings,
      likes: likes.sum?likes.sum:0,
      user: findUser,
      isFriend: idFriend
    };
    return severalcount;
  }

  async getTotalRecord() {
    return {
      count: await this.recordsRepository.count()
    }
  }

  async getRecordSeconds() {
    const total = await this.recordsRepository.createQueryBuilder("records")
      .select("SUM(records.duration::numeric::integer)", "sum")
      .getRawOne();
    const totalRecords = await this.recordsRepository.createQueryBuilder("records")
      .leftJoin("records.answers", "answers")
      .select([
        "records.duration",
        "records.createdAt",
        "answers"
      ])
      .getMany();
    return {
      total: total.sum,
      totalRecords
    }
  }

  async getTotalFriendRequest() {
    return {
      count: await this.friendsRepository.count({ where: { status: "accepted" } })
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

  async deleteVoice(user, id = "") {
    const findVoice = await this.recordsRepository.findOne({ where: { id: id }, relations: ["user"] })
    if (!findVoice) {
      throw new NotFoundException()
    }
    if (user.id != findVoice.user.id) {
      throw new BadRequestException("Invalid User");
    }
    return this.recordsRepository.remove(findVoice)
  }

  async deleteAnswer(user, id = "") {
    const findAnswer = await this.answersRepository.findOne({ where: { id: id }, relations: ["user"] })
    if (!findAnswer) {
      throw new NotFoundException()
    }
    if (user.id != findAnswer.user.id) {
      throw new BadRequestException("Invalid User");
    }
    return this.answersRepository.remove(findAnswer)
  }

  async deleteReplyAnswer(user, id = "") {
    const findReplyAnswer = await this.replyAnswersRepository.findOne({ where: { id: id }, relations: ["user"] })
    if (!findReplyAnswer) {
      throw new NotFoundException()
    }
    if (user.id != findReplyAnswer.user.id) {
      throw new BadRequestException("Invalid User");
    }
    return this.replyAnswersRepository.remove(findReplyAnswer)
  }

  async listenStory(user, storyId, storyType) {
    this.usersService.addHistory(user.id, HistoryTypeEnum.LISTEN_STORY, storyType);
    if (storyType == StoryTypeEnum.RECORD) {
      await this.recordsRepository.update(storyId, { listenCount: () => '"listenCount" + 1' });
    }
    else if (storyType == StoryTypeEnum.ANSWER) {
      await this.answersRepository.update(storyId, { listenCount: () => '"listenCount" + 1' });
    }
    else if (storyType == StoryTypeEnum.REPLY_ANSWER) {
      await this.replyAnswersRepository.update(storyId, { listenCount: () => '"listenCount" + 1' });
    }
  }

  async shareStory(user, storyId, storyType) {
    this.usersService.addHistory(user.id, HistoryTypeEnum.SHARE_STORY, storyType);
    if (storyType == StoryTypeEnum.RECORD) {
      await this.recordsRepository.update(storyId, { shareCount: () => '"shareCount" + 1' });
    }
    else if (storyType == StoryTypeEnum.ANSWER) {
      await this.answersRepository.update(storyId, { shareCount: () => '"shareCount" + 1' });
    }
    else if (storyType == StoryTypeEnum.REPLY_ANSWER) {
      await this.replyAnswersRepository.update(storyId, { shareCount: () => '"shareCount" + 1' });
    }
  }

  async getVoiceByCategory() {
    const categories = await this.connection.query('SELECT "records"."category" AS "records_category", COUNT("records"."id") FROM "records" "records" GROUP BY "records"."category" ORDER BY COUNT("records"."id") DESC LIMIT 5');
    const data = await Promise.all(categories.map(async (cat) => {
      const dataByCat = await this.getRecordsByAdmin(0, 3, 'DESC', "", cat.records_category, "", "");
      return {
        category: cat.records_category,
        data: dataByCat
      }
    }));
    return {
      data
    }
  }

  async getLastVocals() {
    const lastVocals = await this.getRecordsByAdmin(0, 7, 'DESC');
    return {
      lastVocals
    }
  }
}
