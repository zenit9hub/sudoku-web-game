import { QueryHandler, QueryResult, QueryResultFactory } from '../../common/Query.js';
import { GetGameQuery, GetGameResponse } from '../queries/GetGameQuery.js';
import { GameRepository } from '../../../domain/sudoku/repositories/GameRepository.js';

/**
 * 게임 조회 쿼리 핸들러
 */
export class GetGameQueryHandler implements QueryHandler<GetGameQuery, QueryResult<GetGameResponse>> {
  constructor(
    private readonly gameRepository: GameRepository
  ) {}

  async handle(query: GetGameQuery): Promise<QueryResult<GetGameResponse>> {
    const { gameId } = query.request;

    const game = await this.gameRepository.load(gameId);

    const response: GetGameResponse = {
      game,
      exists: game !== null
    };

    return QueryResultFactory.create(response, {
      gameId,
      loadedAt: new Date().toISOString()
    });
  }
}