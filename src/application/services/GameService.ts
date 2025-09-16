import { SudokuGame } from '../../domain/models/SudokuGame.js';
import { SudokuGrid } from '../../domain/models/SudokuGrid.js';
import { GameState, Difficulty } from '../../domain/models/GameState.js';
import { Position } from '../../domain/models/Position.js';
import { CellValue } from '../../domain/models/CellValue.js';
import { Cell } from '../../domain/models/Cell.js';
import { SudokuValidationService } from '../../domain/services/SudokuValidationService.js';
import { SudokuGeneratorService } from '../../domain/services/SudokuGeneratorService.js';
import { GameRepository } from '../../infrastructure/interfaces/GameRepository.js';

export interface MoveResult {
  success: boolean;
  game: SudokuGame;
  isComplete: boolean;
  conflictingPositions: Position[];
}

export interface HintResult {
  success: boolean;
  game: SudokuGame;
  position: Position;
  value: CellValue;
}

export class GameService {
  constructor(
    private readonly gameRepository: GameRepository,
    private readonly validationService: SudokuValidationService
  ) {}

  async createNewGame(difficulty: Difficulty): Promise<SudokuGame> {
    const gameId = this.generateGameId();
    const grid = await this.generateSudokuGrid(difficulty);
    const state = GameState.create(gameId, difficulty);
    
    const game = SudokuGame.create(gameId, grid, state);
    await this.gameRepository.save(game);
    
    return game;
  }

  async loadGame(gameId: string): Promise<SudokuGame | null> {
    return await this.gameRepository.load(gameId);
  }

  async saveGame(game: SudokuGame): Promise<void> {
    await this.gameRepository.save(game);
  }

  async deleteGame(gameId: string): Promise<void> {
    await this.gameRepository.delete(gameId);
  }

  async makeMove(game: SudokuGame, position: Position, value: CellValue): Promise<MoveResult> {
    const cell = game.grid.getCell(position);
    
    if (cell.isGiven) {
      return this.createMoveResult(false, game, false, []);
    }

    const validation = this.validationService.validateMove(game.grid, position, value);
    const newGrid = game.grid.setCell(position, value);
    
    let newState = game.state.addMove();
    if (!validation.isValid) {
      newState = newState.addMistake();
    }

    const updatedGame = game.updateGrid(newGrid).updateState(newState);
    const isComplete = this.validationService.isGridComplete(newGrid);
    
    const finalGame = isComplete ? updatedGame.updateState(newState.complete()) : updatedGame;
    await this.saveGame(finalGame);
    
    return this.createMoveResult(true, finalGame, isComplete, validation.conflictingPositions);
  }

  private createMoveResult(success: boolean, game: SudokuGame, isComplete: boolean, conflictingPositions: Position[]): MoveResult {
    return { success, game, isComplete, conflictingPositions };
  }

  async getHint(game: SudokuGame): Promise<HintResult | null> {
    const emptyCells = game.grid.getAllCells().filter(cell => cell.isEmpty() && !cell.isGiven);
    
    if (emptyCells.length === 0) {
      return null;
    }

    for (const cell of emptyCells) {
      const possibleValues = this.validationService.getPossibleValues(game.grid, cell.position);
      
      if (possibleValues.length === 1) {
        const hintValue = possibleValues[0];
        const newState = game.state.addHint();
        const updatedGame = game.updateState(newState);
        
        await this.saveGame(updatedGame);
        
        return {
          success: true,
          game: updatedGame,
          position: cell.position,
          value: hintValue
        };
      }
    }

    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const possibleValues = this.validationService.getPossibleValues(game.grid, randomCell.position);
    
    if (possibleValues.length > 0) {
      const hintValue = possibleValues[0];
      const newState = game.state.addHint();
      const updatedGame = game.updateState(newState);
      
      await this.saveGame(updatedGame);
      
      return {
        success: true,
        game: updatedGame,
        position: randomCell.position,
        value: hintValue
      };
    }

    return null;
  }

  async selectCell(game: SudokuGame, position: Position): Promise<SudokuGame> {
    const newState = game.state.selectCell(position.row, position.col);
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async clearSelection(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.clearSelection();
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async resetGame(game: SudokuGame): Promise<SudokuGame> {
    const resetGame = game.reset();
    await this.saveGame(resetGame);
    return resetGame;
  }

  async pauseGame(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.pause();
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  async resumeGame(game: SudokuGame): Promise<SudokuGame> {
    const newState = game.state.resume();
    const updatedGame = game.updateState(newState);
    
    await this.saveGame(updatedGame);
    return updatedGame;
  }

  private generateGameId(): string {
    return `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateSudokuGrid(difficulty: Difficulty): Promise<SudokuGrid> {
    console.log(`Generating new ${difficulty} puzzle...`);
    
    try {
      // 새로운 랜덤 시드로 생성기 초기화
      const seed = Date.now() + Math.random() * 1000000;
      const generator = new SudokuGeneratorService(seed);
      
      // 난이도에 따른 퍼즐 생성
      const puzzle = generator.generatePuzzle(difficulty, {
        maxAttempts: 5,
        useSymmetricRemoval: difficulty === Difficulty.EASY // Easy는 대칭 제거로 더 예쁘게
      });
      
      console.log(`Successfully generated ${difficulty} puzzle with seed: ${seed}`);
      return puzzle;
      
    } catch (error) {
      console.error('Failed to generate puzzle, using fallback:', error);
      return this.getFallbackPuzzle(difficulty);
    }
  }

  private getFallbackPuzzle(difficulty: Difficulty): SudokuGrid {
    // 난이도별 기본 퍼즐
    const puzzles = {
      [Difficulty.EASY]: [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9]
      ],
      [Difficulty.MEDIUM]: [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9]
      ],
      [Difficulty.HARD]: [
        [0, 0, 0, 0, 0, 0, 0, 1, 0],
        [4, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 6, 0, 2],
        [0, 0, 0, 0, 0, 3, 0, 7, 0],
        [5, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 0, 0, 0, 0]
      ],
      [Difficulty.EXPERT]: [
        [0, 0, 0, 0, 0, 0, 0, 0, 0],
        [0, 0, 0, 0, 0, 3, 0, 8, 5],
        [0, 0, 1, 0, 2, 0, 0, 0, 0],
        [0, 0, 0, 5, 0, 7, 0, 0, 0],
        [0, 0, 4, 0, 0, 0, 1, 0, 0],
        [0, 9, 0, 0, 0, 0, 0, 0, 0],
        [5, 0, 0, 0, 0, 0, 0, 7, 3],
        [0, 0, 2, 0, 1, 0, 0, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 9]
      ]
    };

    const puzzle = puzzles[difficulty];
    
    // Easy 난이도는 더 많은 숫자 제공
    if (difficulty === Difficulty.EASY) {
      const easyPuzzle = puzzle.map(row => [...row]);
      // 일부 숫자 제거 (40개 정도 남김)
      const cellsToRemove = 41;
      let removed = 0;
      
      while (removed < cellsToRemove) {
        const row = Math.floor(Math.random() * 9);
        const col = Math.floor(Math.random() * 9);
        if (easyPuzzle[row][col] !== 0) {
          easyPuzzle[row][col] = 0;
          removed++;
        }
      }
      
      return this.createGridFromArray(easyPuzzle);
    }

    return this.createGridFromArray(puzzle);
  }

  private createGridFromArray(puzzleArray: number[][]): SudokuGrid {
    const cells = Array.from({ length: 9 }, (_, row) =>
      Array.from({ length: 9 }, (_, col) => {
        const position = new Position(row, col);
        const puzzleValue = puzzleArray[row][col];
        
        if (puzzleValue !== 0) {
          const value = CellValue.from(puzzleValue);
          return new Cell(position, value, { isGiven: true });
        } else {
          return new Cell(position, CellValue.empty(), { isGiven: false });
        }
      })
    );

    return new SudokuGrid(cells);
  }
}