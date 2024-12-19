export interface BaseUser {
  email: string;
  photoURL: string | null;
  displayName: string | null;
  status: 'online' | 'offline';
  lastSeen: Date;
}

export interface OnlineUser extends BaseUser {
  uid: string;
  heartbeat?: Date;
}

export interface UserDocument extends BaseUser {
  heartbeat: Date;
}

export interface UserStatus {
  status: 'online' | 'offline';
  lastSeen: Date;
  heartbeat: Date;
}