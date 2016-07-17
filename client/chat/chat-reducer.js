import { List, Map, OrderedSet, Record, Set } from 'immutable'
import cuid from 'cuid'
import * as SortedList from '../../shared/sorted-list'
import {
  CHAT_INIT_CHANNEL,
  CHAT_LOAD_CHANNEL_HISTORY_BEGIN,
  CHAT_LOAD_CHANNEL_HISTORY,
  CHAT_LOAD_USER_LIST_BEGIN,
  CHAT_LOAD_USER_LIST,
  CHAT_UPDATE_MESSAGE,
  CHAT_UPDATE_USER_ACTIVE,
  CHAT_UPDATE_USER_IDLE,
  CHAT_UPDATE_USER_OFFLINE,
} from '../actions'

const sortUsers = (a, b) => a.localeCompare(b)

// Create partial evaluations all the SortedList functions with our sort function pre-applied
const SortedUsers =
    Object.keys(SortedList)
      .map(fnName => [fnName, (...args) => SortedList[fnName](sortUsers, ...args)])
      .reduce((prev, cur) => {
        prev[cur[0]] = cur[1]
        return prev
      }, {})

export const Users = new Record({
  active: new List(),
  idle: new List(),
  offline: new List(),
})

export const Channel = new Record({
  name: null,
  messages: new List(),
  users: new Users(),

  hasLoadedHistory: false,
  loadingHistory: false,
  hasHistory: true,

  hasLoadedUserList: false,
  loadingUserList: false,
})

export const ChatState = new Record({
  channels: new OrderedSet(),
  byName: new Map(),
})

// id, type, and time need to be present for ALL message types
export const ChatMessage = new Record({
  id: null,
  type: 'message',
  time: 0,
  from: null,
  text: null,
})
export const UserOnlineMessage = new Record({
  id: null,
  type: 'userOnline',
  time: 0,
  user: null,
})
export const UserOfflineMessage = new Record({
  id: null,
  type: 'userOffline',
  time: 0,
  user: null,
})

function updateUserState(user, addTo, removeFirst, removeSecond) {
  const addToUpdated = SortedUsers.insert(addTo, user)

  const firstIndex = SortedUsers.findIndex(removeFirst, user)
  const removeFirstUpdated = firstIndex > -1 ? removeFirst.remove(firstIndex) : removeFirst

  const secondIndex = SortedUsers.findIndex(removeSecond, user)
  const removeSecondUpdated = secondIndex !== -1 ? removeSecond.remove(secondIndex) : removeSecond

  return [ addToUpdated, removeFirstUpdated, removeSecondUpdated ]
}

const handlers = {
  [CHAT_INIT_CHANNEL](state, action) {
    const { channel, activeUsers } = action.payload
    const sortedActiveUsers = SortedUsers.create(activeUsers)
    const record = new Channel({
      name: channel,
      users: new Users({
        active: sortedActiveUsers,
      })
    })
    return (state.update('channels', c => c.add(channel))
      .setIn(['byName', channel], record))
  },

  [CHAT_UPDATE_MESSAGE](state, action) {
    const { id, channel, time, user, message } = action.payload
    return state.updateIn(['byName', channel, 'messages'], m => {
      return m.push(new ChatMessage({
        id,
        time,
        from: user,
        text: message,
      }))
    })
  },

  [CHAT_UPDATE_USER_ACTIVE](state, action) {
    const { channel, user } = action.payload
    let wasIdle = false
    let updated = state.updateIn(['byName', channel, 'users'], users => {
      const [ active, idle, offline ] =
          updateUserState(user, users.active, users.idle, users.offline)
      wasIdle = idle !== users.idle

      return users.set('active', active).set('idle', idle).set('offline', offline)
    })

    if (!wasIdle) {
      updated = updated.updateIn(['byName', channel, 'messages'], m => {
        return m.push(new UserOnlineMessage({
          id: cuid(),
          time: Date.now(),
          user,
        }))
      })
    }

    return updated
  },

  [CHAT_UPDATE_USER_IDLE](state, action) {
    const { channel, user } = action.payload
    return state.updateIn(['byName', channel, 'users'], users => {
      const [ idle, active, offline ] =
          updateUserState(user, users.idle, users.active, users.offline)

      return users.set('active', active).set('idle', idle).set('offline', offline)
    })
  },

  [CHAT_UPDATE_USER_OFFLINE](state, action) {
    const { channel, user } = action.payload
    return state.updateIn(['byName', channel, 'users'], users => {
      const [ offline, active, idle ] =
          updateUserState(user, users.offline, users.active, users.idle)

      return users.set('active', active).set('idle', idle).set('offline', offline)
    }).updateIn(['byName', channel, 'messages'], m => {
      return m.push(new UserOfflineMessage({
        id: cuid(),
        time: Date.now(),
        user,
      }))
    })
  },

  [CHAT_LOAD_CHANNEL_HISTORY_BEGIN](state, action) {
    const { channel } = action.payload
    return (state.setIn(['byName', channel, 'hasLoadedHistory'], true)
      .setIn(['byName', channel, 'loadingHistory'], true))
  },

  [CHAT_LOAD_CHANNEL_HISTORY](state, action) {
    const { channel } = action.meta
    const newMessages = action.payload
    const updated = state.setIn(['byName', channel, 'loadingHistory'], false)
    if (!newMessages.length) {
      return updated.setIn(['byName', channel, 'hasHistory'], false)
    }

    // TODO(tec27): remove dupes when doing the message merge
    return updated.updateIn(['byName', channel, 'messages'], messages => {
      return new List(newMessages.map(msg => new ChatMessage({
        id: msg.id,
        time: msg.sent,
        from: msg.user,
        text: msg.data.text,
      }))).concat(messages)
    })
  },

  [CHAT_LOAD_USER_LIST_BEGIN](state, action) {
    const { channel } = action.payload
    return (state.setIn(['byName', channel, 'hasLoadedUserList'], true)
      .setIn(['byName', channel, 'loadingUserList'], true))
  },

  [CHAT_LOAD_USER_LIST](state, action) {
    const { channel } = action.meta
    const userList = action.payload
    return (state.setIn(['byName', channel, 'loadingUserList'], false)
      .updateIn(['byName', channel, 'users'], users => {
        const offline =
            SortedUsers.create(new Set(userList).subtract(users.active).subtract(users.idle))
        return users.set('offline', offline)
      }))
  },
}

export default function(state = new ChatState(), action) {
  return handlers.hasOwnProperty(action.type) ? handlers[action.type](state, action) : state
}
