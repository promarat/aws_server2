import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { SubScribeEntity } from "../../entities/subscribe.entity";
import { Repository } from "typeorm";
import { SubScribeRequest } from "../dto/subscribe.request";

@Injectable()
export class SubScribeService {
  constructor(
    @InjectRepository(SubScribeEntity) private subscribeRepository: Repository<SubScribeEntity>,
  ) {
  }

  /*for auth*/
  findOneByEmail(email: string): Promise<SubScribeEntity> {
    return this.subscribeRepository.createQueryBuilder('subscribe')
      .where( 'subscribe.email ilike :email', { email })
      .select( [
        "subscribe.id",
        "subscribe.email",
      ])
      .getOne()
  }

  async addSubScribe(newUser: SubScribeRequest): Promise<SubScribeEntity> {
    const existUser = await this.findOneByEmail(newUser.email);
    if (existUser) {
      throw new BadRequestException("User with current email already subscribed");
    }

    const subscribe = new SubScribeEntity();
    subscribe.email = newUser.email;
    return this.subscribeRepository.save(subscribe);
  }

  async getSubScribeCount() {
    const count = await this.subscribeRepository.count();
    return {
      count: count
    };
  }
}
