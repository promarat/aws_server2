export enum Order {
  ASC = 'ASC',
  DESC = 'DESC',
}

export enum GenderEnum {
  MALE = 'm',
  FEMALE = 'f',
  OTHER = 'other'
}

export enum PremiumEnum {
  NONE = 'none',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

export enum FriendsStatusEnum {
  NONE = 'none',
  ACCEPTED = 'accepted',
  PENDING = 'pending',
  BLOCKED = 'blocked',
}

export enum NotificationTypeEnum {
  LIKE_RECORD = 'likeRecord',
  LIKE_ANSWER = 'likeAnswer',
  NEW_ANSWER = 'newAnswer',
  FRIEND_REQUEST = 'friendRequest',
  FRIEND_ACCEPT = 'friendAccept',
  FRIEND_DELETE = 'friendDelete',
  USER_BLOCK = 'userBlock',
  TAG_FRIEND = 'tagFriend'
}

export enum FileTypeEnum {
  AUDIO = 'audio',
  IMAGE = 'image',
}

export enum StoryTypeEnum {
  RECORD = "record",
  ANSWER = "answer",
  REPLY_ANSWER = "replyAnswer"
}

export interface tagUser {
  id:string,
  name: string
}
