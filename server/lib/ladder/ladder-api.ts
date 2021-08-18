import Router from '@koa/router'
import Joi from 'joi'
import { GetRankingsPayload, LadderPlayer } from '../../../common/ladder'
import { ALL_MATCHMAKING_TYPES, MatchmakingType } from '../../../common/matchmaking'
import { User } from '../../../common/users/user-info'
import { HttpApi, httpApi } from '../http/http-api'
import { apiEndpoint } from '../http/http-api-endpoint'
import { JobScheduler } from '../jobs/job-scheduler'
import { getRankings, refreshRankings } from '../matchmaking/models'
import ensureLoggedIn from '../session/ensure-logged-in'

const UPDATE_RANKS_MINUTES = 5

@httpApi('/ladder')
export class LadderApi implements HttpApi {
  constructor(private jobScheduler: JobScheduler) {
    const startTime = new Date()
    const timeRemainder = UPDATE_RANKS_MINUTES - (startTime.getMinutes() % UPDATE_RANKS_MINUTES)
    startTime.setMinutes(startTime.getMinutes() + timeRemainder, 0, 0)
    this.jobScheduler.scheduleJob(
      'lib/ladder#updateRanks',
      startTime,
      UPDATE_RANKS_MINUTES * 60 * 1000,
      async () => {
        await refreshRankings(MatchmakingType.Match1v1)
      },
    )
  }

  applyRoutes(router: Router): void {
    router.use(ensureLoggedIn).get('/:matchmakingType', this.getRankings)
  }

  getRankings = apiEndpoint(
    {
      params: Joi.object<{ matchmakingType: MatchmakingType }>({
        matchmakingType: Joi.valid(...ALL_MATCHMAKING_TYPES).required(),
      }),
    },
    async (ctx, { params }): Promise<GetRankingsPayload> => {
      const rankings = await getRankings(params.matchmakingType)

      const players: LadderPlayer[] = []
      const users: User[] = []
      for (const r of rankings) {
        players.push({
          rank: r.rank,
          userId: r.userId,
          rating: r.rating,
          wins: r.wins,
          losses: r.losses,
          lastPlayedDate: Number(r.lastPlayedDate),
        })
        users.push({
          id: r.userId,
          name: r.username,
        })
      }

      return {
        totalCount: rankings.length,
        players,
        users,
      }
    },
  )
}
