import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AnswersEntity } from "../entities/answers.entity";
import { Repository } from "typeorm";
import { LikesEntity, LikeTypeEnum } from "../entities/llikes.entity";
import { RecordsEntity } from "../entities/records.entity";
import { FileService } from "../files/file.service";
import { UsersEntity } from "../entities/users.entity";
import { FriendsEntity } from "../entities/friends.entity";
import { FileTypeEnum, FriendsStatusEnum, NotificationTypeEnum } from "../lib/enum";
import { CountryEntity } from "../entities/countries.entity";
import { NotificationsService } from "src/notifications/notifications.service";

@Injectable()
export class ActionsService {
  constructor(
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(LikesEntity) private likesRepository: Repository<LikesEntity>,
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @InjectRepository(FriendsEntity) private friendsRepository: Repository<FriendsEntity>,
    @InjectRepository(CountryEntity) private countriesRepository: Repository<CountryEntity>,
    private readonly filesService: FileService,
    private readonly notificationService: NotificationsService
  ) {
  }

  async answerToRecord(user, record, duration, buffer, filename) {
    const findRecord = await this.recordsRepository.createQueryBuilder("record")
      .where({ id: record })
      .select(["record.id"])
      .getOne();
    if (!findRecord) {
      throw new NotFoundException("record not found");
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

  async likeRecord(userId: string, recordId: string, body) {
    const record = await this.recordsRepository.findOne({ where: { id: recordId } });
    if (!record) {
      throw new NotFoundException();
    }

    const existingLike = await this.likesRepository.findOne({
        where: {
          user: userId,
          record: recordId
        }
      }
    );
    if (existingLike) {
      // return this.recordsRepository.update(record.id, { likesCount: record.likesCount + body.count });
      return existingLike;
    }
    const like = new LikesEntity();
    like.user = await this.usersRepository.findOne({ where: { id: userId } });
    like.record = record;
    like.type = LikeTypeEnum.RECORD;
    like.emoji = body.emoji;
    // await this.recordsRepository.update(record.id, { likesCount: record.likesCount + 1/*body.count*/ });
    record.likesCount = record.likesCount + 1;
    this.recordsRepository.save(record);

    await this.likesRepository
      .createQueryBuilder()
      .insert()
      .into(LikesEntity)
      .values(like)
      .execute();
    return like;
  }

  async likeAnswer(userId: string, answerId: string, body) {
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
    if (existingLike) {
      return existingLike;
      // await this.answersRepository.update(answer.id, { likesCount: answer.likesCount + body.count });
    }
    const like = new LikesEntity();
    like.user = await this.usersRepository.findOne({ where: { id: userId } });
    like.answer = answer;
    like.type = LikeTypeEnum.ANSWER;
    // await this.answersRepository.update(answer.id, { likesCount: answer.likesCount + 1 });
    answer.likesCount = answer.likesCount + 1;
    this.answersRepository.save(answer);

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
}
