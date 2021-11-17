import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { NotificationsEntity } from "../entities/notification.entity";
import { Repository } from "typeorm";
import { paginationHelper } from "../lib/helpers";

@Injectable()
export class NotificationsService {
  constructor(@InjectRepository(NotificationsEntity) private notificationRepository: Repository<NotificationsEntity>) {
  }

  getNotificationsByUser(page, limit, order, user): Promise<NotificationsEntity[]> {
    const paginate = paginationHelper(page, limit);
    return this.notificationRepository
      .createQueryBuilder('notifications')
      .where({ toUser: user.id })
      .leftJoin('notifications.fromUser', 'fromUser')
      .leftJoin('notifications.records', 'records')
      .leftJoin('notifications.answers', 'answers')
      .select([
        'notifications.id',
        'notifications.type',
        'notifications.seen',
        'notifications.createdAt',
        'records.id',
        'answers.id',
        'fromUser.id',
        'fromUser.pseudo'
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
}
