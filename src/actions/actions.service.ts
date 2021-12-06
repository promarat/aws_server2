import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AnswersEntity } from "../entities/answers.entity";
import { Repository, getConnection } from "typeorm";
import { LikesEntity, LikeTypeEnum } from "../entities/llikes.entity";
import { RecordsEntity } from "../entities/records.entity";
import { FileService } from "../files/file.service";
import { UsersEntity } from "../entities/users.entity";
import { FriendsEntity } from "../entities/friends.entity";
import { FileTypeEnum, FriendsStatusEnum, NotificationTypeEnum } from "../lib/enum";
import { CountryEntity } from "../entities/countries.entity";
import { NotificationsService } from "src/notifications/notifications.service";
import { ReportsEntity, ReportTypeEnum } from "src/entities/reports.entity";
import { ReactionsEntity } from "src/entities/reaction.entity";

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(LikesEntity) private likesRepository: Repository<LikesEntity>,
    @InjectRepository(ReactionsEntity) private reactionsRepository: Repository<ReactionsEntity>,
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @InjectRepository(FriendsEntity) private friendsRepository: Repository<FriendsEntity>,
    @InjectRepository(CountryEntity) private countriesRepository: Repository<CountryEntity>,
    @InjectRepository(ReportsEntity) private reportsRepository: Repository<ReportsEntity>,
    private readonly filesService: FileService,
    private readonly notificationService: NotificationsService
  ) {
  }

  async answerToRecord(user, record, duration, buffer, filename) {
    const findRecord = await this.recordsRepository.createQueryBuilder("record")
      .leftJoin('record.user', 'user')
      .where({ id: record })
      .select(["record.id", "user.id"])
      .getOne();

    if (!findRecord) {
      throw new NotFoundException("record not found");
    }

    if (findRecord.user.id != user.id) {
      const touser = await this.usersRepository.findOne({ where: { id: findRecord.user.id } });
      this.notificationService.sendNotification(user, touser, findRecord, null, null, NotificationTypeEnum.NEW_ANSWER);
    }

    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const entity = new AnswersEntity();
    entity.record = findRecord;
    entity.duration = duration;
    entity.file = uploadFile;
    entity.createdAt = new Date();
    entity.user = user;
    return this.answersRepository.save(entity);
  }

  async likeRecord(user, recordId: string, body) {
    const record = await this.recordsRepository.createQueryBuilder("record")
      .leftJoin('record.user', 'user')
      .where({ id: recordId })
      .select(["record.id", "record.likesCount", "user.id"])
      .getOne();
    if (!record) {
      throw new NotFoundException();
    }

    const existingLike = await this.likesRepository.findOne({
        where: {
          user: user.id,
          record: recordId
        }
      }
    );
    if (existingLike) {
      throw new BadRequestException("already appreciate");
    }

    if (record.user.id != user.id) {
      const touser = await this.usersRepository.findOne({ where: { id: record.user.id } });
      this.notificationService.sendNotification(user, touser, record, null, null, NotificationTypeEnum.LIKE_RECORD);
    }

    const like = new LikesEntity();
    like.user = await this.usersRepository.findOne({ where: { id: user.id } });
    like.record = record;
    like.type = LikeTypeEnum.RECORD;
    like.emoji = ""; // body.emoji;
    getConnection().createQueryBuilder().update("records").set({ likesCount : record.likesCount + 1 }).where({ id: record.id}).execute();

    await this.likesRepository
      .createQueryBuilder()
      .insert()
      .into(LikesEntity)
      .values(like)
      .execute();
    return like;
  }

  async reactionRecord(user, recordId: string, body) {
    const record = await this.recordsRepository.createQueryBuilder("record")
      .leftJoin('record.user', 'user')
      .where({ id: recordId })
      .select(["record.id", "record.reactionsCount", "user.id"])
      .getOne();
    if (!record) {
      throw new NotFoundException();
    }
    
    const existingReaction = await this.reactionsRepository.findOne({
        where: {
          user: user.id,
          record: recordId
        }
      }
    );
    if (existingReaction) {
      throw new BadRequestException("already reaction");
    }

    // if (record.user.id != user.id) {
    //   const touser = await this.usersRepository.findOne({ where: { id: record.user.id } });
    //   this.notificationService.sendNotification(user, touser, record, null, null, NotificationTypeEnum.LIKE_RECORD);
    // }

    const reaction = new ReactionsEntity();
    reaction.user = await this.usersRepository.findOne({ where: { id: user.id } });
    reaction.record = record;
    reaction.emoji = body.emoji;
    getConnection().createQueryBuilder().update("records").set({ reactionsCount : record.reactionsCount + 1 }).where({ id: record.id}).execute();

    await this.reactionsRepository
    .createQueryBuilder()
    .insert()
    .into(ReactionsEntity)
    .values(reaction)
    .execute();

    return reaction;
  }

  async likeAnswer(user, answerId: string, body) {
    const answer = await this.answersRepository.createQueryBuilder("answer")
    .leftJoin('answer.user', 'user')
    .where({ id: answerId })
    .select(["answer.id", "answer.likesCount", "user.id"])
    .getOne();
    if (!answer) {
      throw new NotFoundException("answer not found");
    }

    const existingLike = await this.likesRepository.findOne({
        where: {
          user: user.id,
          answer: answerId
        }
      }
    );
    if (existingLike) {
      throw new BadRequestException("already appreciate");
    }

    if (answer.user.id != user.id) {
      const touser = await this.usersRepository.findOne({ where: { id: answer.user.id } });
      this.notificationService.sendNotification(user, touser, null, answer, null, NotificationTypeEnum.LIKE_ANSWER);
    }

    const like = new LikesEntity();
    like.user = await this.usersRepository.findOne({ where: { id: user.id } });
    like.answer = answer;
    like.type = LikeTypeEnum.ANSWER;
    
    getConnection().createQueryBuilder().update("answers").set({ likesCount : answer.likesCount + 1 }).where({ id: answer.id}).execute();

    await this.likesRepository
      .createQueryBuilder()
      .insert()
      .into(LikesEntity)
      .values(like)
      .execute();
    return like;
  }

  async unLikeRecord(userId: string, recordId: string) {
    const record = await this.recordsRepository.findOne({ where: { id: recordId } });
    if (!record) {
      throw new NotFoundException("record not found");
    }

    const existingLike = await this.likesRepository.findOne({
        where: {
          user: userId,
          record: recordId
        }
      }
    );
    if (!existingLike) {
      throw new BadRequestException("like not found");
    }
    await this.recordsRepository.update(record.id, { likesCount: record.likesCount - 1 });
    return this.likesRepository.delete(existingLike.id);
  }

  async unLikeAnswer(userId: string, answerId: string) {
    const answer = await this.answersRepository.findOne({ where: { id: answerId } });
    if (!answer) {
      throw new NotFoundException("answer not found");
    }

    const existingLike = await this.likesRepository.findOne({
        where: {
          user: userId,
          answer: answerId
        }
      }
    );
    if (!existingLike) {
      throw new BadRequestException("like not found");
    }
    await this.answersRepository.update(answer.id, { likesCount: answer.likesCount - 1 });
    return this.likesRepository.delete(existingLike.id);
  }

  async acceptFriend(user, friendId) {
    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: friendId, friend: user.id } });
    if (!existFriend) {
      // throw new BadRequestException("user already friend");
      throw new NotFoundException();
    }

    if ( existFriend.status == FriendsStatusEnum.ACCEPTED ){
      throw new BadRequestException("user already friend");
    }
    // const entity = new FriendsEntity();
    // entity.user = userId;
    // entity.friend = findFriend;
    // entity.status = FriendsStatusEnum.ACCEPTED; //todo add notification service
    existFriend.status = FriendsStatusEnum.ACCEPTED; //todo add notification service
    this.notificationService.sendNotification(user, findFriend, null, null, null, NotificationTypeEnum.FRIEND_ACCEPT);
    return this.friendsRepository.save(existFriend);
  }

  async removeFriend(user, friendId) {
    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: friendId } });
    if (!existFriend) {
      throw new BadRequestException("user not you friend");
    }

    this.notificationService.sendNotification(user, findFriend, null, null, null, NotificationTypeEnum.FRIEND_DELETE);
    return this.friendsRepository.delete(existFriend.id);
  }

  async followFriend(user, friendId) {
    if (user.id == friendId) {
      throw new BadRequestException("nolja??");
    }

    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: friendId } });
    if (existFriend) {
      throw new BadRequestException("user already followed");
    }
    const entity = new FriendsEntity();
    entity.user = user.id;
    entity.friend = findFriend;
    entity.status = FriendsStatusEnum.PENDING; //todo add notification service
    const savedentity = await this.friendsRepository.save(entity);
    this.notificationService.sendNotification(user, findFriend, null, null, savedentity, NotificationTypeEnum.FRIEND_REQUEST);
    return savedentity;
  }
  
  async getAllCountries() {
    return this.countriesRepository.find();
  }

  async removeRecord(userId, recordId) {
    const findRecord = await this.recordsRepository.findOne({ where: { id: recordId, user:userId } });
    if (!findRecord) {
      throw new NotFoundException();
    }

    return this.recordsRepository.delete(findRecord.id);
  }

  async createReport(user, type: string, target: string, record = "", answer = "") {
    const targetUser = await this.usersRepository.findOne({ where: { id: target } });
    if (!targetUser) {
      throw new NotFoundException();
    }

    const report = new ReportsEntity();
    report.reporter = user;
    report.type = <ReportTypeEnum> type;
    report.target = targetUser;

    if (record != "") {
      const reportRecord = await this.recordsRepository.findOne({ where: { id: record } });
      if (!reportRecord) {
        throw new NotFoundException("record not found");
      }

      report.record = reportRecord;
    }

    if (answer != "") {
      const reportAnswer = await this.answersRepository.findOne({ where: { id: answer } });
      if (!reportAnswer) {
        throw new NotFoundException("answer not found");
      }

      report.answer = reportAnswer;
    }

    return await this.reportsRepository.save(report);
  }
}
