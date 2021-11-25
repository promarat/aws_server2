import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationsEntity } from "../entities/notification.entity";
import { Repository } from "typeorm";
import { paginationHelper } from "../lib/helpers";
import { NotificationTypeEnum } from "../lib/enum";
import { UsersEntity } from "src/entities/users.entity";
import { RecordsEntity } from "src/entities/records.entity";
import { AnswersEntity } from "src/entities/answers.entity";
import { FriendsEntity } from "src/entities/friends.entity";
import { UnreadNotificationResponse } from "./dto/notificationresponse.dto";
import { type } from "os";

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(NotificationsEntity) private notificationRepository: Repository<NotificationsEntity>) {
  }

  getNotificationsByUser(page, limit, order, user): Promise<NotificationsEntity[]> {
    const paginate = paginationHelper(page, limit);
    return this.notificationRepository
      .createQueryBuilder('notifications')
      .where({ toUser: user.id})
      .andWhere("notifications.type <> :notitype", {notitype: NotificationTypeEnum.FRIEND_REQUEST})
      .leftJoin('notifications.fromUser', 'fromUser')
      .leftJoin("fromUser.avatar", "avatar")
      .leftJoin('notifications.record', 'records')
      .leftJoin('notifications.answer', 'answers')
      .select([
        'notifications.id',
        'notifications.type',
        'notifications.seen',
        'notifications.createdAt',
        'records.id',
        'records.emoji',
        'answers.id',
        'answers.emoji',
        'fromUser.id',
        'avatar.url'
        // 'fromUser.pseudo'
      ])
      .limit(paginate.getLimit)
      .offset(paginate.offset)
      .orderBy('notifications.createdAt', order)
      .getMany()
  }

 async seenNotification(id, user) {
    const findNotification = await this.notificationRepository.findOne({where: { toUser: user.id, id }})
    if(!findNotification) {
      throw new NotFoundException()
    }
    if(findNotification.seen) {
      throw new BadRequestException('already seen')
    }
    return this.notificationRepository.update(findNotification.id, { seen: true })
  }

  async sendNotification(sender: UsersEntity, reciever: UsersEntity, record: RecordsEntity, answer: AnswersEntity, friend: FriendsEntity,  type: NotificationTypeEnum) {
    const notification = new NotificationsEntity();
    notification.type = type;
    notification.seen = false;
    notification.fromUser = sender;
    notification.toUser = reciever;
    notification.record = record;
    notification.answer = answer;
    notification.friend = friend;
    return this.notificationRepository.save(notification);
  }

  async getUnreadArticleCount(user) {
    console.log(user);
    const { count } = await this.notificationRepository
    .createQueryBuilder('notifications')
    .where({ toUser: user.id, seen: false})
    .andWhere("notifications.type <> :notitype", {notitype: NotificationTypeEnum.FRIEND_REQUEST})
    .select([
      'COUNT(notifications.id)'
    ]).getRawOne();

    const UnReadCount: any = {
      count: count
    };

    console.log("UnReadCount--", count, UnReadCount);
    return UnReadCount;
  }

  async getUnreadRequestCount(user) {
    console.log(user);
    const { count } = await this.notificationRepository
    .createQueryBuilder('notifications')
    .where({ toUser: user.id, seen: false, type: NotificationTypeEnum.FRIEND_REQUEST})
    .select([
      'COUNT(notifications.id)'
    ]).getRawOne();

    const UnReadCount: any = {
      count: count
    };

    console.log("UnReadCount--", count, UnReadCount);
    return UnReadCount;
  }
}
