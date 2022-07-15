import { BadRequestException, ConsoleLogger, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { AnswersEntity } from "../entities/answers.entity";
import { ReplyAnswersEntity } from "src/entities/reply-answer.entity";
import { Repository, getConnection, In } from "typeorm";
import { LikesEntity, LikeTypeEnum } from "../entities/llikes.entity";
import { RecordsEntity } from "../entities/records.entity";
import { FileService } from "../files/file.service";
import { MailsService } from "../mail/mail.service";
import { RecordsService } from "../records/records.service";
import { UsersEntity } from "../entities/users.entity";
import { FriendsEntity } from "../entities/friends.entity";
import { FileTypeEnum, FriendsStatusEnum, NotificationTypeEnum, StoryTypeEnum } from "../lib/enum";
import { CountryEntity } from "../entities/countries.entity";
import { NotificationsService } from "src/notifications/notifications.service";
import { ReportsEntity, ReportTypeEnum } from "src/entities/reports.entity";
import { ReactionsEntity } from "src/entities/reaction.entity";
import { filter, find } from "lodash";
import { TagsEntity } from "src/entities/tag.entity";
import { UsersService } from "src/users/users.service";
import { HistoryTypeEnum } from "src/entities/history.entity";
import { MessagesEntity } from "src/entities/message.entity";
import { ConversationsEntity } from "src/entities/conversations.entity";
import { Twilio } from 'twilio';
import { ConfigService } from "nestjs-config";
import { throwIfEmpty } from "rxjs";

@Injectable()
export class ActionsService {
  private twilioClient: Twilio;
  constructor(
    @InjectRepository(AnswersEntity) private answersRepository: Repository<AnswersEntity>,
    @InjectRepository(ReplyAnswersEntity) private replyAnswersRepository: Repository<ReplyAnswersEntity>,
    @InjectRepository(MessagesEntity) private MessagesRepository: Repository<MessagesEntity>,
    @InjectRepository(LikesEntity) private likesRepository: Repository<LikesEntity>,
    @InjectRepository(ReactionsEntity) private reactionsRepository: Repository<ReactionsEntity>,
    @InjectRepository(RecordsEntity) private recordsRepository: Repository<RecordsEntity>,
    @InjectRepository(UsersEntity) private usersRepository: Repository<UsersEntity>,
    @InjectRepository(TagsEntity) private tagsRepository: Repository<TagsEntity>,
    @InjectRepository(FriendsEntity) private friendsRepository: Repository<FriendsEntity>,
    @InjectRepository(CountryEntity) private countriesRepository: Repository<CountryEntity>,
    @InjectRepository(ReportsEntity) private reportsRepository: Repository<ReportsEntity>,
    @InjectRepository(ConversationsEntity) private conversationsRepository: Repository<ConversationsEntity>,
    private readonly filesService: FileService,
    private readonly notificationService: NotificationsService,
    private mailService: MailsService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {
    const accountSid = this.configService.get('app.twilio_account_sid');
    const authToken = this.configService.get('app.twilio_auth_token');
    this.twilioClient = new Twilio(accountSid, authToken);
  }

  async answerToRecord(user, record, duration, emoji, buffer, filename) {
    const findRecord = await this.recordsRepository.createQueryBuilder("record")
      .leftJoin('record.user', 'user')
      .where({ id: record })
      .select(["record.id", "user.id", "user.email"])
      .getOne();

    if (!findRecord) {
      throw new NotFoundException("record not found");
    }

    const findUser = await this.usersRepository.findOne({ where: { id: user.id } });
    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const entity = new AnswersEntity();
    entity.record = findRecord;
    entity.duration = duration;
    entity.file = uploadFile;
    entity.createdAt = new Date();
    entity.user = user;
    entity.emoji = emoji;

    if (findRecord.user.id != user.id) {
      const touser = await this.usersRepository.findOne({ where: { id: findRecord.user.id } });
      await this.notificationService.sendNotification(user, touser, findRecord, entity, null, NotificationTypeEnum.NEW_ANSWER);
      //await this.mailService.sentNotifyToUser(findRecord.user.id,`${findUser.name} answered you!`,{nav:"VoiceProfile",params:{info:records[0],answerId:entity.id}});
      let usersId = [];
      usersId.push(findRecord.user.id);
      await this.mailService.sentNotifyToUser(usersId, `${findUser.name} t'a répondu ! 🤩`, { nav: "VoiceProfile", params: { id: findRecord.id, answerId: entity.id } });
    }

    return this.answersRepository.save(entity);
  }

  async deleteTag(user, id = "") {
    const findTag = await this.tagsRepository.findOne({ where: { id: id }, relations: ["user"] })
    if (!findTag) {
      throw new NotFoundException()
    }
    if (user.id != findTag.user.id) {
      throw new BadRequestException("Invalid User");
    }
    return this.tagsRepository.remove(findTag)
  }

  async tagFriends(user, storyId, storyType, tagUserIds, recordId, answerId) {
    const findUser = await this.usersRepository.findOne({ where: { id: user.id } });
    if (storyType == StoryTypeEnum.RECORD) {
      const findTag = await this.tagsRepository.findOne({
        where: {
          user: user.id,
          record: recordId,
        }
      }
      );
      if (findTag) {
        let oldUsers = findTag.userIds;
        const newUsers = [...new Set([...oldUsers, ...tagUserIds])];
        await this.tagsRepository.update(findTag.id, { userIds: newUsers });
      }
      else {
        const tag = new TagsEntity();
        tag.user = user.id;
        tag.record = recordId;
        tag.type = StoryTypeEnum.RECORD;
        tag.userIds = tagUserIds;
        await this.tagsRepository
          .createQueryBuilder()
          .insert()
          .into(TagsEntity)
          .values(tag)
          .execute();
      }
      this.mailService.sentNotifyToUser(tagUserIds, `${findUser.name} t’as identifié dans une histoire ! 🤩`, { nav: "VoiceProfile", params: { id: recordId } });
      tagUserIds.map(async toUserId => {
        await this.notificationService.sendNotification(user, toUserId, recordId, null, null, NotificationTypeEnum.TAG_FRIEND);
      })
    }
    else if (storyType == StoryTypeEnum.ANSWER) {

    }
    else if (storyType == StoryTypeEnum.REPLY_ANSWER) {

    }
    return 1;
  }

  async deleteMessages(messageIds) {
    await this.MessagesRepository.delete({ id: In(messageIds) });
  }

  async getMessages(user, toUserId) {
    const messages = await this.MessagesRepository.createQueryBuilder("messages")
      .leftJoin('messages.user', 'user')
      .leftJoin('messages.toUser', 'toUser')
      .leftJoin('messages.file', 'file')
      .leftJoin('messages.record', 'record')
      .leftJoin('record.user', 'recordUser')
      .leftJoin('recordUser.avatar', 'avatar')
      .leftJoin('record.file', 'recordFile')
      .select([
        "messages.id",
        "messages.type",
        "messages.emoji",
        "messages.duration",
        "messages.ancestorId",
        "messages.createdAt",
        "user.id",
        "toUser.id",
        "file.url",
        'record.id',
        'record.title',
        'record.likesCount',
        'record.listenCount',
        'record.duration',
        'record.createdAt',
        'recordUser.id',
        'recordUser.name',
        'recordUser.avatarNumber',
        'avatar.url',
        'recordFile.url'
      ])
      .where({ user: user.id, toUser: toUserId })
      .orWhere({ user: toUserId, toUser: user.id })
      .orderBy("messages.createdAt", "ASC")
      .getMany();
    ;
    if (messages.length > 0) {
      const findConversation = await this.conversationsRepository.createQueryBuilder("conversation")
        .leftJoin('conversation.sender', 'sender')
        .leftJoin('conversation.receiver', 'receiver')
        .select([
          "conversation.id",
          "conversation.newsCount",
          "sender.id",
          "receiver.id",
        ])
        .where({ sender: user.id, receiver: toUserId })
        .orWhere({ sender: toUserId, receiver: user.id })
        .getOne();

      if (findConversation.sender.id == toUserId && findConversation.newsCount > 0) {
        await this.conversationsRepository.update(findConversation.id, { newsCount: 0 });
      }
    }
    return messages;
  }


  async confirmMessage(user, toUserId) {
    await this.conversationsRepository.createQueryBuilder("conversation").update().set({ newsCount: 0 }).where({ sender: toUserId, receiver: user.id }).execute();
  }

  async getConversations(user) {
    const conversations = await this.conversationsRepository.createQueryBuilder("conversation")
      .leftJoin('conversation.sender', 'sender')
      .leftJoin('sender.avatar', 'senderAvatar')
      .leftJoin('conversation.receiver', 'receiver')
      .leftJoin('receiver.avatar', 'receiverAvatar')
      .select([
        "conversation.id",
        "conversation.newsCount",
        "conversation.updatedAt",
        "conversation.emoji",
        "conversation.type",
        "sender.id",
        "sender.name",
        "sender.premium",
        "sender.avatarNumber",
        "sender.phoneNumber",
        "senderAvatar.url",
        "receiver.id",
        "receiver.name",
        "receiver.premium",
        "receiver.avatarNumber",
        "receiver.phoneNumber",
        "receiverAvatar.url"
      ])
      .where({ sender: user.id })
      .orWhere({ receiver: user.id })
      .orderBy("conversation.updatedAt","DESC")
      .getMany();
    return conversations;
  }

  async getTagUsers(user, tagId) {
    const findTag = await this.tagsRepository.findOne({ where: { id: tagId } });
    const queryBuilder = this.usersRepository.createQueryBuilder("user")
      .leftJoin('user.avatar', 'avatar')
      .select([
        "user.id",
        "user.name",
        "user.premium",
        "user.avatarNumber",
        "user.phoneNumber",
        "avatar.url"
      ])
      .where({ id: In(findTag.userIds) })
      ;
    return await queryBuilder.getMany();
  }

  compare(a, b) {
    return b.recordsCount - a.recordsCount;
  }

  async getActiveUsers() {
    const users = await this.usersRepository.createQueryBuilder("user")
      .leftJoin('user.avatar', 'avatar')
      .loadRelationCountAndMap("user.recordsCount", "user.records", "records")
      .select([
        "user.id",
        "user.name",
        "user.premium",
        "user.avatarNumber",
        "user.phoneNumber",
        "avatar.url"
      ])
      .getMany();
    users.sort(this.compare);
    return users.slice(0, 20);
  }

  async getTags(user, storyId, storyType) {
    if (storyType == StoryTypeEnum.RECORD) {
      let tags = await this.tagsRepository
        .createQueryBuilder("tags")
        .where({ record: storyId })
        .leftJoin("tags.user", "user")
        .leftJoin("user.avatar", "avatar")
        .select([
          "tags.id",
          "tags.userIds",
          "tags.createdAt",
          "tags.likesCount",
          "user.id",
          "user.name",
          "user.avatarNumber",
          "user.phoneNumber",
          "avatar.link",
          "avatar.url"
        ])
        .getMany();
      const tagIds = tags.map((el) => el.id);
      const likes = tagIds.length ? await this.getTagLikesByIds(tagIds, user.id) : [];
      return tags.map((el, index) => {
        const findUserLike = find(likes, (obj) => (obj.tagFriend.id === el.id));
        return {
          ...el,
          isLiked: findUserLike ? true : false,
        };
      });
    }
    return 0;
  }

  getTagLikesByIds(ids, userId): Promise<LikesEntity[]> {
    return this.likesRepository
      .createQueryBuilder("likes")
      .innerJoin("likes.tagFriend", "tagFriend", "tagFriend.id in (:...ids)", { ids })
      .leftJoin("likes.user", "user")
      .select([
        "likes.id",
        "likes.isLike",
        "user.id",
        "tagFriend.id"
      ])
      .where({ user: userId })
      .andWhere({ isLike: true })
      .getMany();
  }

  async replyToAnswer(user, answer, duration, buffer, filename) {
    const findAnswer = await this.answersRepository.createQueryBuilder("answer")
      .where({ id: answer })
      .select(["answer.id"])
      .getOne();

    if (!findAnswer) {
      throw new NotFoundException("record not found");
    }

    const uploadFile = await this.filesService.uploadFile(buffer, filename, FileTypeEnum.AUDIO);
    const entity = new ReplyAnswersEntity();
    entity.answer = findAnswer;
    entity.duration = duration;
    entity.file = uploadFile;
    entity.createdAt = new Date();
    entity.user = user;

    return this.replyAnswersRepository.save(entity);
  }

  async addMessage(user, body, file) {
    let toUserId = body.user, type = body.type, duration = body.duration, ancestorId = body.ancestor, emoji = body.emoji, record = body.record;
    const findUser = await this.usersRepository.findOne({ where: { id: toUserId } })

    if (!findUser) {
      throw new NotFoundException("user not found");
    }

    const findConversation = await this.conversationsRepository.createQueryBuilder("conversation")
      .leftJoin('conversation.sender', 'sender')
      .leftJoin('conversation.receiver', 'receiver')
      .select([
        "conversation.id",
        "sender.id",
        "receiver.id",
      ])
      .where({ sender: user.id, receiver: toUserId })
      .orWhere({ sender: toUserId, receiver: user.id })
      .getOne();

    if (findConversation) {
      if (findConversation.sender.id == user.id) {
        await this.conversationsRepository.update(findConversation.id, { newsCount: () => '"newsCount" + 1', type: type, emoji: emoji });
      }
      else {
        await this.conversationsRepository.update(findConversation.id, { newsCount: 1, sender: user.id, receiver: toUserId, type: type, emoji: emoji });
      }
    }
    else {
      const conversation = new ConversationsEntity();
      conversation.sender = user.id;
      conversation.receiver = toUserId;
      conversation.type = type;
      conversation.emoji = emoji;
      await this.conversationsRepository
        .createQueryBuilder()
        .insert()
        .into(ConversationsEntity)
        .values(conversation)
        .execute();
    }

    const uploadFile = file ? await this.filesService.uploadFile(file.buffer, file.originalname, type == 'voice' ? FileTypeEnum.AUDIO : FileTypeEnum.IMAGE) : null;
    const entity = new MessagesEntity();
    entity.type = type;
    entity.toUser = findUser;
    entity.duration = duration;
    entity.file = uploadFile;
    entity.record = record;
    entity.user = user;
    entity.ancestorId = ancestorId;
    entity.emoji = emoji
    return this.MessagesRepository.save(entity);
  }

  async likeRecord(user, recordId: string) {
    const record = await this.recordsRepository.createQueryBuilder("record")
      .leftJoin('record.user', 'user')
      .where({ id: recordId })
      .select(["record.id", "record.likesCount", "user.id", "user.email"])
      .getOne();
    if (!record) {
      throw new NotFoundException();
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        user: user.id,
        record: recordId,
        isLike: true,
      }
    }
    );
    if (existingLike) {
      throw new BadRequestException("already appreciate");
    }

    if (record.user.id != user.id) {
      const touser = await this.usersRepository.findOne({ where: { id: record.user.id } });
      await this.notificationService.sendNotification(user, touser, record, null, null, NotificationTypeEnum.LIKE_RECORD);
    }

    getConnection().createQueryBuilder().update("records").set({ likesCount: record.likesCount + 1 }).where({ id: record.id }).execute();

    const existing = await this.likesRepository.findOne({
      where: {
        user: user.id,
        record: recordId,
      }
    }
    );

    if (!existing) {
      const like = new LikesEntity();
      like.user = await this.usersRepository.findOne({ where: { id: user.id } });
      like.record = record;
      like.type = LikeTypeEnum.RECORD;
      like.emoji = ""; // body.emoji;
      await this.likesRepository
        .createQueryBuilder()
        .insert()
        .into(LikesEntity)
        .values(like)
        .execute();
      //this.mailService.sentNotifyToUser(record.user.id,'Your vocal is popular!',{nav:"Discover",params:{}});
      let usersId = [];
      usersId.push(record.user.id);
      this.mailService.sentNotifyToUser(usersId, "Ton histoire est populaire ! 😱", { nav: "Discover", params: {} });
      if (record.likesCount + 1 == 50) {
        //this.mailService.sentNotifyToUsers('Here is a story that might interest you 👀',{nav:"Discover",params:{}});
        this.mailService.sentNotifyToUsers("Voici une histoire qui pourrait t'intéresser 👀", { nav: "Discover", params: {} });
      }
      return like;
    }
    else {
      return await this.likesRepository.update(existing.id, { isLike: true });
    }
  }

  async reactionRecord(user, recordId: string, body) {
    const record = await this.recordsRepository.createQueryBuilder("record")
      .leftJoin('record.user', 'user')
      .where({ id: recordId })
      .select(["record.id", "record.reactionsCount", "user.id"])
      .getOne();
    if (!record || record.user.id == user.id) {
      throw new NotFoundException();
    }

    let addcount = 1;
    const existingReaction = await this.reactionsRepository.findOne({
      where: {
        user: user.id,
        record: recordId
      }
    }
    );
    if (existingReaction) {
      this.reactionsRepository.remove(existingReaction);
      addcount = 0;
    }

    // if (record.user.id != user.id) {
    //   const touser = await this.usersRepository.findOne({ where: { id: record.user.id } });
    //   this.notificationService.sendNotification(user, touser, record, null, null, NotificationTypeEnum.LIKE_RECORD);
    // }

    const reaction = new ReactionsEntity();
    reaction.user = await this.usersRepository.findOne({ where: { id: user.id } });
    reaction.record = record;
    reaction.emoji = body.emoji;
    getConnection().createQueryBuilder().update("records").set({ reactionsCount: record.reactionsCount + addcount }).where({ id: record.id }).execute();

    await this.reactionsRepository
      .createQueryBuilder()
      .insert()
      .into(ReactionsEntity)
      .values(reaction)
      .execute();

    const recordreactions = await this.getReactionsByIds([recordId]);
    const findReactions = filter(recordreactions, (obj) => obj.record.id === recordId);
    if (findReactions.length == 1) {
      //this.mailService.sentNotifyToUser(record.user.id,`${reaction.user.name} reacted to your story!`,{nav:"UserProfile",params:{userId:user.id}});
      let usersId = [];
      usersId.push(record.user.id);
      this.mailService.sentNotifyToUser(usersId, `${reaction.user.name} a réagi à ton histoire ! 👀`, { nav: "UserProfile", params: { userId: user.id } });
    }
    const payload: any = {
      last: 'OK',
    };
    return {
      lastreactions: findReactions && findReactions.length > 3 ? findReactions.slice(0, 3) : (findReactions ? findReactions : []),
      reactioncount: findReactions && findReactions.length > 0 ? findReactions.length : 0
    }
    // return reaction;
  }

  getReactionsByIds(ids): Promise<ReactionsEntity[]> {
    return this.reactionsRepository
      .createQueryBuilder("reactions")
      .innerJoin("reactions.record", "record", "record.id in (:...ids)", { ids })
      .leftJoin("reactions.user", "user")
      .select([
        "reactions.id",
        "reactions.emoji",
        "user.id",
        "record.id"
      ])
      .orderBy("reactions.createdAt", "DESC")
      .getMany();
  }

  async unLikeRecord(userId: string, recordId: string) {
    const record = await this.recordsRepository.findOne({ where: { id: recordId } });
    if (!record) {
      throw new NotFoundException("record not found");
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        user: userId,
        record: recordId,
        isLike: true,
      }
    }
    );
    if (!existingLike) {
      throw new BadRequestException("like not found");
    }
    if (record.likesCount > 0)
      await this.recordsRepository.update(record.id, { likesCount: record.likesCount - 1 });
    return await this.likesRepository.update(existingLike.id, { isLike: false });
  }

  async likeAnswer(user, answerId: string) {
    const answer = await this.answersRepository.createQueryBuilder("answer")
      .leftJoin('answer.user', 'user')
      .leftJoin('answer.record', 'record')
      .where({ id: answerId })
      .select(["answer.id", "answer.likesCount", "user.id", "record.id"])
      .getOne();
    if (!answer) {
      throw new NotFoundException("answer not found");
    }
    const existingLike = await this.likesRepository.findOne({
      where: {
        user: user.id,
        answer: answerId,
        isLike: true,
      }
    }
    );
    if (existingLike) {
      throw new BadRequestException("already appreciate");
    }
    if (answer.user.id != user.id) {
      const touser = await this.usersRepository.findOne({ where: { id: answer.user.id } });
      await this.notificationService.sendNotification(user, touser, answer.record, answer, null, NotificationTypeEnum.LIKE_ANSWER);
    }

    getConnection().createQueryBuilder().update("answers").set({ likesCount: answer.likesCount + 1 }).where({ id: answer.id }).execute();

    const existing = await this.likesRepository.findOne({
      where: {
        user: user.id,
        answer: answerId,
      }
    }
    );
    if (existing) {
      return this.likesRepository.update(existing.id, { isLike: true });
    }
    else {
      const like = new LikesEntity();
      like.user = await this.usersRepository.findOne({ where: { id: user.id } });
      like.answer = answer;
      like.type = LikeTypeEnum.ANSWER;
      await this.likesRepository
        .createQueryBuilder()
        .insert()
        .into(LikesEntity)
        .values(like)
        .execute();
      return like;
    }
  }

  async unLikeAnswer(userId: string, answerId: string) {
    const answer = await this.answersRepository.findOne({ where: { id: answerId } });
    if (!answer) {
      throw new NotFoundException("answer not found");
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        user: userId,
        answer: answerId,
        isLike: true,
      }
    }
    );
    if (!existingLike) {
      throw new BadRequestException("like not found");
    }
    if (answer.likesCount > 0)
      await this.answersRepository.update(answer.id, { likesCount: answer.likesCount - 1 });
    return await this.likesRepository.update(existingLike.id, { isLike: false });
  }

  async likeTag(user, tagId, isLike) {
    const tag = await this.tagsRepository.createQueryBuilder("tag")
      .leftJoin('tag.user', 'user')
      .where({ id: tagId })
      .select(["tag.id", "tag.likesCount", "user.id"])
      .getOne();
    if (!tag) {
      throw new NotFoundException("tag not found");
    }
    const existingLike = await this.likesRepository.findOne({
      where: {
        user: user.id,
        tagFriend: tagId,
      }
    }
    );
    if (isLike == 'true') {
      if (existingLike) {
        if (existingLike.isLike == true) {
          throw new BadRequestException("already appreciate");
        }
        return this.likesRepository.update(existingLike.id, { isLike: true });
      }
      else {
        const like = new LikesEntity();
        like.user = user;
        like.tagFriend = tag;
        like.type = LikeTypeEnum.TAG_FRIEND;
        await this.likesRepository
          .createQueryBuilder()
          .insert()
          .into(LikesEntity)
          .values(like)
          .execute();
        return like;
      }
    }
    else {
      if (existingLike) {
        if (existingLike.isLike == false) {
          throw new BadRequestException("already unAppreciate");
        }
        return this.likesRepository.update(existingLike.id, { isLike: false });
      }
      else {
        throw new BadRequestException("already unAppreciate");
      }
    }
  }

  async likeReplyAnswer(userId, replyAnswerId) {
    const replyAnswer = await this.replyAnswersRepository.createQueryBuilder("replyAnswer")
      .leftJoin('replyAnswer.user', 'user')
      .leftJoin('replyAnswer.answer', 'answer')
      .where({ id: replyAnswerId })
      .select(["replyAnswer.id", "replyAnswer.likesCount", "user.id", "answer.id"])
      .getOne();
    if (!replyAnswer) {
      throw new NotFoundException("replyAnswer not found");
    }
    const existingLike = await this.likesRepository.findOne({
      where: {
        user: userId,
        replyAnswer: replyAnswerId,
        isLike: true,
      }
    }
    );
    if (existingLike) {
      throw new BadRequestException("already appreciate");
    }
    // if (replyAnswer.user.id != user.id) {
    //   const touser = await this.usersRepository.findOne({ where: { id: replyAnswer.user.id } });
    //   await this.notificationService.sendNotification(user, touser, replyAnswer.record, replyAnswer, null, NotificationTypeEnum.LIKE_ANSWER);
    // }
    await this.replyAnswersRepository.update(replyAnswerId, { likesCount: replyAnswer.likesCount + 1 });

    const existing = await this.likesRepository.findOne({
      where: {
        user: userId,
        replyAnswer: replyAnswerId,
      }
    }
    );
    if (existing) {
      return this.likesRepository.update(existing.id, { isLike: true });
    }
    else {
      const like = new LikesEntity();
      like.user = await this.usersRepository.findOne({ where: { id: userId } });
      like.replyAnswer = replyAnswer;
      like.type = LikeTypeEnum.REPLY_ANSWER;
      await this.likesRepository
        .createQueryBuilder()
        .insert()
        .into(LikesEntity)
        .values(like)
        .execute();
      return like;
    }
  }

  async unLikeReplyAnswer(userId: string, replyAnswerId: string) {
    const replyAnswer = await this.replyAnswersRepository.findOne({ where: { id: replyAnswerId } });
    if (!replyAnswer) {
      throw new NotFoundException("answer not found");
    }

    const existingLike = await this.likesRepository.findOne({
      where: {
        user: userId,
        replyAnswer: replyAnswerId,
        isLike: true,
      }
    }
    );
    if (!existingLike) {
      throw new BadRequestException("like not found");
    }
    if (replyAnswer.likesCount > 0)
      await this.replyAnswersRepository.update(replyAnswer.id, { likesCount: replyAnswer.likesCount - 1 });
    return await this.likesRepository.update(existingLike.id, { isLike: false });
  }

  async acceptFriend(user, friendId, requestId) {
    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    const findUser = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: friendId, friend: user.id } });
    if (!existFriend) {
      // throw new BadRequestException("user already friend");
      throw new NotFoundException();
    }

    if (existFriend.status == FriendsStatusEnum.ACCEPTED) {
      throw new BadRequestException("user already friend");
    }
    // const entity = new FriendsEntity();
    // entity.user = userId;
    // entity.friend = findFriend;
    // entity.status = FriendsStatusEnum.ACCEPTED; //todo add notification service
    existFriend.status = FriendsStatusEnum.ACCEPTED; //todo add notification service
    const rewardFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: friendId } });
    if (rewardFriend) {
      console.log("eeeee");
      rewardFriend.status = FriendsStatusEnum.ACCEPTED;
      await this.friendsRepository.save(rewardFriend)
    }
    else {
      console.log("FFFFF");
      const entity = new FriendsEntity();
      entity.user = user.id;
      entity.friend = friendId;
      entity.status = FriendsStatusEnum.ACCEPTED; //todo add notification service
      await this.friendsRepository.save(entity);
    }
    await this.notificationService.sendNotification(user, findFriend, null, null, null, NotificationTypeEnum.FRIEND_ACCEPT);
    await this.notificationService.deleteNotification(user, requestId);
    //this.mailService.sentNotifyToUser(findFriend.id,`${findUser.name} has accepted your friend request ✨`,{nav:"UserProfile",params:{userId:user.id}});
    let usersId = [];
    usersId.push(findFriend.id);
    this.mailService.sentNotifyToUser(usersId, `${findUser.name} a accepté ta demande d'ami ✨`, { nav: "UserProfile", params: { userId: user.id } });
    return await this.friendsRepository.save(existFriend);
  }

  async removeFriend(userId, friendId) {
    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: userId, friend: friendId } });
    if (!existFriend) {
      throw new BadRequestException("user not you friend");
    }
    existFriend.status = FriendsStatusEnum.NONE;
    //this.notificationService.sendNotification(user, findFriend, null, null, null, NotificationTypeEnum.FRIEND_DELETE);
    return this.friendsRepository.save(existFriend);
  }

  async followFriend(user, friendId) {
    if (user.id == friendId) {
      throw new BadRequestException("error");
    }

    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    const findUser = await this.usersRepository.findOne({ where: { id: user.id } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: friendId } });
    let savedEntity = null;
    if (existFriend) {
      existFriend.status = FriendsStatusEnum.PENDING;
      savedEntity = await this.friendsRepository.save(existFriend)
    }
    else {
      const entity = new FriendsEntity();
      entity.user = user.id;
      entity.friend = findFriend;
      entity.status = FriendsStatusEnum.PENDING; //todo add notification service
      savedEntity = await this.friendsRepository.save(entity);
    }
    let usersId = [];
    usersId.push(findFriend.id);
    //this.mailService.sentNotifyToUser(usersId,`${findUser.name} wants to be your friend 🤩`,{nav:"Notification",params:{}});
    this.mailService.sentNotifyToUser(usersId, `${findUser.name} veut être ton ami 🤩`, { nav: "Notification", params: {} });
    const towardFriend = await this.friendsRepository.findOne({ where: { user: friendId, friend: user.id } });
    let towardEntity = null;
    if(towardFriend){
      towardEntity = towardFriend;
    }
    else{
      const entity = new FriendsEntity();
      entity.user = friendId;
      entity.friend = user.id;
      entity.status = FriendsStatusEnum.NONE; //todo add notification service
      towardEntity = await this.friendsRepository.save(entity);
    }
    this.notificationService.sendNotification(user, findFriend, null, null, savedEntity, NotificationTypeEnum.FRIEND_REQUEST, towardEntity);
    return savedEntity;
  }

  async deleteSuggest(user, friendId) {
    if (user.id == friendId) {
      throw new BadRequestException("error");
    }

    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: friendId } });
    let savedentity;
    if (existFriend) {
      existFriend.suggest = false;
      savedentity = await this.friendsRepository.save(existFriend)
    }
    else {
      const entity = new FriendsEntity();
      entity.user = user.id;
      entity.friend = findFriend;
      entity.suggest = false; //todo add notification service
      savedentity = await this.friendsRepository.save(entity);
    }
    return savedentity;
  }

  async inviteFriend(user, phoneNumber) {
    if (user.phoneNumber == phoneNumber) {
      throw new BadRequestException("error");
    }
    this.twilioClient.messages
      .create({
        body: `Hey! Join Vocco app and discover the best stories from the world! It's reaaaaally cool!!`,
        messagingServiceSid: 'MG6063d6266081e91c2ba70b7fa3807b21',
        to: phoneNumber
      })
      .then(message => console.log(message.sid));
    return 0;
  }

  async blockUser(user, friendId) {
    if (user.id == friendId) {
      throw new BadRequestException("error");
    }

    const findFriend = await this.usersRepository.findOne({ where: { id: friendId } });
    if (!findFriend) {
      throw new NotFoundException();
    }
    const existFriend = await this.friendsRepository.findOne({ where: { user: user.id, friend: friendId } });
    let savedentity;
    if (existFriend) {
      existFriend.status = FriendsStatusEnum.BLOCKED;
      savedentity = await this.friendsRepository.save(existFriend);
    }
    else {
      const entity = new FriendsEntity();
      entity.user = user.id;
      entity.friend = findFriend;
      entity.status = FriendsStatusEnum.BLOCKED; //todo add notification service
      savedentity = await this.friendsRepository.save(entity);
    }
    const reverse = await this.friendsRepository.findOne({ where: { user: friendId, friend: user.id } });
    if (reverse) {
      existFriend.status = FriendsStatusEnum.BLOCKED;
      await this.friendsRepository.save(existFriend);
    }
    else {
      const entity = new FriendsEntity();
      entity.user = findFriend;
      entity.friend = user.id;
      entity.status = FriendsStatusEnum.BLOCKED; //todo add notification service
      await this.friendsRepository.save(entity);
    }
    //this.notificationService.sendNotification(user, findFriend, null, null, savedentity, NotificationTypeEnum.USER_BLOCK);
    return savedentity;
  }

  async getAllCountries() {
    return this.countriesRepository.find();
  }

  async removeRecord(userId, recordId) {
    const findRecord = await this.recordsRepository.findOne({ where: { id: recordId, user: userId } });
    if (!findRecord) {
      throw new NotFoundException();
    }

    return await this.recordsRepository.delete(findRecord.id);
  }

  async createReport(user, type: string, target: string, record = "", answer = "") {
    const targetUser = await this.usersRepository.findOne({ where: { id: target } });
    if (!targetUser) {
      throw new NotFoundException();
    }

    const report = new ReportsEntity();
    report.reporter = user;
    report.type = <ReportTypeEnum>type;
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

  async shareLink(user) {
    this.usersService.addHistory(user.id, HistoryTypeEnum.SHARE_LINK);
    await this.usersRepository.update(user.id, { shareLinkCount: () => '"shareLinkCount" + 1' });
  }
}
