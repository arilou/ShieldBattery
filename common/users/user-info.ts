import { Opaque } from 'type-fest'
import { GameRecordJson } from '../games/games'
import { Jsonify } from '../json'
import { LadderPlayer } from '../ladder'
import { MapInfoJson } from '../maps'
import { MatchmakingType } from '../matchmaking'
import { SbPolicyType } from '../policies/policy-type'
import { SbPermissions } from './permissions'
import { UserStats } from './user-stats'

export type SbUserId = Opaque<number, 'SbUser'>

/**
 * Information about any user in the system, mainly things that represent the "identity" of the
 * user.
 */
export interface SbUser {
  id: SbUserId
  name: string
}

/**
 * Converts a user ID number into a properly typed version. Alternative methods of retrieving an
 * SbUserId should be preferred, such as using a value retrieved from the database, or getting one
 * via the common Joi validator.
 */
export function makeSbUserId(id: number): SbUserId {
  return id as SbUserId
}

/** Information about the current user. */
export interface SelfUser extends SbUser {
  email: string
  emailVerified: boolean
  /** The last version of the privacy policy this user has seen/accepted. */
  acceptedPrivacyVersion: number
  /** The last version of the terms of service this user has seen/accepted. */
  acceptedTermsVersion: number
  /** The last version of the acceptable use policy this user has seen/accepted. */
  acceptedUsePolicyVersion: number
}

/**
 * Detailed information about a user, such as their ladder ranking, win record, etc.
 */
export interface UserProfile {
  userId: SbUserId
  created: Date
  ladder: Partial<Record<MatchmakingType, LadderPlayer>>
  userStats: UserStats
}

export type UserProfileJson = Jsonify<UserProfile>

export function toUserProfileJson(userProfile: UserProfile): UserProfileJson {
  return {
    userId: userProfile.userId,
    created: Number(userProfile.created),
    ladder: userProfile.ladder,
    userStats: userProfile.userStats,
  }
}

// TODO(tec27): Add more error codes for the various failures
export enum UserErrorCode {
  NotFound = 'notFound',
}

/** Information returned for /users/:id/profile, intended to be able to fill out a profile page. */
export interface GetUserProfileResponse {
  user: SbUser
  profile: UserProfileJson
  matchHistory: {
    games: GameRecordJson[]
    maps: MapInfoJson[]
    users: SbUser[]
  }
}

export interface GetBatchUserInfoResponse {
  userInfos: SbUser[]
}

export interface AcceptPoliciesRequest {
  policies: Array<[policyType: SbPolicyType, version: number]>
}

export interface AcceptPoliciesResponse {
  user: SelfUser
}

export interface AdminGetPermissionsResponse {
  user: SbUser
  permissions: SbPermissions
}

export interface AdminUpdatePermissionsRequest {
  permissions: SbPermissions
}
