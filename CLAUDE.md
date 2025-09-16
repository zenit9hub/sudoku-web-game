# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sudoku web game built with TypeScript and HTML5 Canvas, implementing Domain-Driven Design (DDD) architecture. The game features interactive gameplay, responsive design, and clean separation of concerns across domain, application, infrastructure, and presentation layers.

## Development Commands

**Primary Development**:
- `npm run dev` - Start development server (Vite, port 3000, auto-opens browser)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run preview` - Preview production build locally

**Testing**:
- `npm test` - Run Jest tests once
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report

**Code Quality**:
- `npm run lint` - ESLint check on TypeScript files
- `npm run typecheck` - TypeScript type checking without emit

## Architecture Overview

The codebase follows **Domain-Driven Design (DDD)** with strict layered architecture:

### Core Layers
- **Domain** (`src/domain/`): Pure business logic, models, and domain services
  - Contains core entities: `SudokuGame`, `SudokuGrid`, `Cell`, `Position`, `GameState`
  - Domain services: `SudokuGeneratorService`, `SudokuValidationService`
  - No external dependencies - pure business logic only

- **Application** (`src/application/`): Use cases and application services
  - `GameService`: Orchestrates domain operations and persistence

- **Infrastructure** (`src/infrastructure/`): External concerns like persistence
  - `LocalStorageGameRepository`: Game state persistence to browser localStorage

- **Presentation** (`src/presentation/`): UI layer with specialized rendering
  - **Controllers**: `GameController` - handles user interactions and game flow
  - **Renderers**: Specialized Canvas rendering classes
    - `CanvasGameRenderer`: Main renderer orchestrating other renderers
    - `BoardRenderer`: Sudoku grid and board visual elements
    - `SelectionEffectsRenderer`: Cell selection and highlighting effects

### Key Design Patterns

**Immutable Domain Models**: All domain entities return new instances on updates rather than mutating state.

**Specialized Renderer Pattern**: Canvas rendering is split into focused, single-responsibility classes:
- `CanvasGameRenderer`: Orchestrates overall game rendering
- `BoardRenderer`: Handles grid, numbers, and static board elements
- `SelectionEffectsRenderer`: Manages selection highlighting and visual effects

**Dependency Injection**: All dependencies are injected through constructors, making the codebase testable and modular.

## Key Technical Decisions

**Module System**: ESM modules with `.js` extensions in imports (required for ES modules in TypeScript)

**Path Aliases**: Configured for clean imports:
- `@/domain/*` → `src/domain/*`
- `@/application/*` → `src/application/*`
- `@/infrastructure/*` → `src/infrastructure/*`
- `@/presentation/*` → `src/presentation/*`

**Canvas Architecture**: High-performance rendering using specialized renderer classes that handle specific visual concerns, enabling smooth 60fps gameplay.

**Game State Management**: Immutable state updates with clear separation between current game state and initial puzzle state for reset functionality.

## Game Features & Logic

**Puzzle Generation**: Advanced algorithms in `SudokuGeneratorService` ensure unique, solvable puzzles with configurable difficulty levels (Easy/Medium/Hard/Expert based on number of given cells).

**Interactive Gameplay**:
- Click-to-select cells with keyboard number input (1-9)
- Real-time validation and error highlighting
- Smart number highlighting across the board
- Row/column selection effects
- Hint system and reset functionality

**Responsive Design**: Dynamic canvas scaling maintains aspect ratio across different screen sizes while preserving game functionality.

## Testing Strategy

Tests are located in `__tests__` directories alongside source files. Focus areas:
- Domain model validation and business logic
- Sudoku generation algorithms
- Game state management
- Canvas rendering functionality

Jest configuration includes path aliases matching the main TypeScript config for consistent imports in tests.