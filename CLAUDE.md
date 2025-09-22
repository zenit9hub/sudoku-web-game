# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Sudoku web game built with TypeScript and HTML5 Canvas, implementing Domain-Driven Design (DDD) architecture. The game features professional mobile app-style UI, interactive gameplay, responsive design, and clean separation of concerns across domain, application, infrastructure, and presentation layers.

**Live Demo**: [GitHub Pages](https://zenit.github.io/sudoku-web-game/)

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

The codebase follows **Domain-Driven Design (DDD)** with strict layered architecture and advanced domain patterns:

### Core Layers

#### **Domain Layer** (`src/domain/`)
Pure business logic with sophisticated domain patterns:

**Core Aggregates & Entities**:
- `SudokuGame`: Root aggregate managing game lifecycle and state
- `SudokuGrid`: Grid aggregate with cell management and validation
- `GameState`: Entity tracking game progress and statistics
- `Position`, `CellValue`: Value objects with business rules

**Advanced Domain Services**:
- `AdvancedPuzzleGenerationService`: Sophisticated puzzle generation with quality metrics
- `ComprehensiveValidationService`: Multi-level validation with caching and performance tracking
- `EnhancedGridValidationService`: Rule-based validation with configurable difficulty
- `LineCompletionDetectionService`: Smart detection of completed rows/columns/boxes

**Domain Events System**:
- Complete event-driven architecture with `DomainEventPublisher`
- Events: `GameStarted`, `ValidMoveCompleted`, `InvalidMoveAttempted`, `GameCompleted`, etc.
- Event handlers for analytics, notifications, and side effects

**Business Rules Engine**:
- `SudokuBusinessRules`: Flexible rule system supporting multiple validation levels
- Rules: `NoConflictRule`, `ValidPositionRule`, `ValidValueRule`, `CompletionRule`
- Configurable rule priority and error messaging

#### **Application Layer** (`src/application/`)
CQRS pattern with comprehensive application services:

**Application Services**:
- `SudokuApplicationService`: Main orchestrator with advanced features
- `EffectApplicationService`: Visual effects and animations management
- `ApplicationFacade`: Unified entry point for all application operations

**Command/Query Pattern**:
- Commands: `CreateNewGameCommand`, `MakeMoveCommand`, `ValidateComprehensivelyCommand`
- Queries: `GetGameQuery`, `GetGameHintQuery`
- Handlers: Dedicated handlers for each command/query with result patterns

**Advanced Features**:
- Comprehensive move validation with warnings and suggestions
- Real-time validation during input
- Batch validation for entire grids
- Advanced puzzle generation with quality metrics

#### **Infrastructure Layer** (`src/infrastructure/`)
- `LocalStorageGameRepository`: Persistent game state management
- Canvas-based rendering with specialized renderer classes
- Performance-optimized rendering pipeline

#### **Presentation Layer** (`src/presentation/`)
- **Controllers**: `GameController` - handles user interactions and game flow
- **Renderers**: Specialized Canvas rendering classes
  - `CanvasGameRenderer`: Main renderer orchestrating other renderers
  - `BoardRenderer`: Sudoku grid and board visual elements
  - `SelectionEffectsRenderer`: Cell selection and highlighting effects

### Key Design Patterns

**Domain-Driven Design (DDD)**:
- Bounded contexts with clear domain boundaries
- Aggregate roots managing consistency boundaries
- Domain events for loose coupling between bounded contexts
- Rich domain models with behavior, not just data

**Event-Driven Architecture**:
- Domain events for side effects and integration
- Event sourcing patterns for audit trails
- Asynchronous event processing with proper error handling

**CQRS (Command Query Responsibility Segregation)**:
- Separate command and query models
- Dedicated handlers for each operation
- Result patterns for consistent error handling

**Business Rules Engine**:
- Composable validation rules with priority systems
- Configurable rule engines for different validation levels
- Separation of business logic from validation infrastructure

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

**Performance Optimization**:
- Validation result caching for improved response times
- Performance metrics tracking for optimization insights
- Efficient batch validation for large operations

## Game Features & Logic

### Advanced Puzzle Generation
- **Quality Metrics**: Puzzles evaluated on difficulty, symmetry, aesthetics, and uniqueness
- **Solving Techniques**: Analysis of required techniques (naked singles, hidden pairs, X-wing, etc.)
- **Configurable Parameters**: Target clue count, symmetry requirements, maximum generation attempts
- **Performance Tracking**: Generation time and attempt statistics

### Enhanced Validation System
- **Multi-Level Validation**: Basic, Standard, Strict, and Expert validation levels
- **Real-Time Feedback**: Instant validation during number input with conflict highlighting
- **Comprehensive Analysis**: Detailed error messages, warnings, and strategic suggestions
- **Batch Processing**: Efficient validation of entire grids with conflict analysis

### Interactive Gameplay Features
- **Smart Input System**: Click-to-select cells with keyboard number input (1-9)
- **Visual Feedback**: Real-time validation, error highlighting, and completion effects
- **Advanced Hints**: Context-aware hints with difficulty ratings and reasoning
- **Game Analytics**: Move statistics, mistake tracking, and performance metrics
- **State Management**: Save/load, pause/resume, and reset functionality

### Professional Mobile App UI
- **Header Navigation**: Back button, title, and action icons (⭐ 📝 🎨 ⚙️)
- **Game Information Bar**: Real-time score, difficulty, mistakes counter ("실패: 0 / 3"), and timer
- **Interactive Toolbar**: Four main actions - Undo, Clear, Notes (ON/OFF status), Hints (counter display)
- **Enhanced Number Pad**: Visual remaining count for each digit (1-9) with modern button design
- **Status Indicators**: Progress tracking ("0/81"), difficulty display, and mistake tracking
- **Responsive Layout**: Optimized sections with proper height distribution and mobile-first design

### Visual Effects System
- **Line Completion Effects**: Animated celebrations for completed rows/columns/boxes
- **Cascading Animations**: Smooth transitions with configurable timing and effects
- **Performance Optimized**: 60fps rendering with efficient canvas management
- **Modern UI Components**: CSS custom properties, component-based styling, professional color scheme

**Responsive Design**: Dynamic canvas scaling maintains aspect ratio across different screen sizes while preserving game functionality and mobile app aesthetics.

## Testing Strategy

### Test Infrastructure
Tests are located in `__tests__` directories alongside source files with comprehensive domain testing utilities:

**Domain Test Utilities** (`src/domain/common/testing/DomainTestUtils.ts`):
- `TestEventPublisher`: Mock event publisher for testing domain events
- `TestBusinessRule`: Configurable rules for validation testing
- `TestDataBuilder`: Factory methods for creating test data (grids, positions, cell values)
- `TestAssertions`: Specialized assertions for domain concepts
- `TestScenarioBuilder`: Fluent API for building complex test scenarios
- `TestMockFactory`: Pre-configured mocks for common domain services

### Test Focus Areas
- **Domain Model Validation**: Business logic and domain rules testing
- **Event-Driven Architecture**: Domain event publishing and handling
- **Advanced Algorithms**: Puzzle generation and validation algorithms
- **Performance Testing**: Validation caching and performance metrics
- **Integration Testing**: Cross-layer interaction and data flow
- **Canvas Rendering**: Visual component functionality

### Test Configuration
- Jest configuration with path aliases matching TypeScript config
- Domain test utilities for consistent testing patterns
- Mock factories for complex domain services
- Performance assertion helpers for optimization validation

Jest configuration includes path aliases matching the main TypeScript config for consistent imports in tests.

## Build and Deployment

### Build Status
✅ **All TypeScript compilation errors resolved**
- Complete type safety across all layers
- No unused imports or variables
- Proper async/await pattern implementation
- Strict TypeScript configuration compliance

### Production Build
- Optimized Vite bundle: ~67KB gzipped
- Tree-shaking for unused code elimination
- Source maps for debugging support
- Performance-optimized asset loading

## Recent Architectural Enhancements

### UX/UI Modernization (Latest - 2025)
- **Mobile App-Style Interface**: Complete UI overhaul following modern mobile app design patterns
- **Component-Based Styling**: Organized CSS with custom properties and component isolation
- **Professional Layout**: Header navigation, game info bar, interactive toolbar, and enhanced number pad
- **Status Indicators**: Real-time mistake counter, difficulty display, progress tracking, and timer
- **Responsive Design**: Mobile-first approach with optimized section heights and layouts
- **GitHub Pages Integration**: Automated deployment with proper base path configuration

### Phase 3: Application Layer Integration (Completed)
- Implemented comprehensive CQRS pattern with commands and queries
- Added advanced application services with multi-level validation
- Created unified ApplicationFacade for clean API boundaries
- Integrated event-driven architecture throughout application layer

### Build Error Resolution (Completed)
- Systematically resolved all TypeScript compilation errors
- Fixed domain event system type compatibility
- Corrected Command/Query interface implementations
- Cleaned up unused imports and variables
- Ensured proper async/await pattern usage
- Validated complete build pipeline functionality

### Deployment & CI/CD (Completed)
- GitHub Actions workflow with automated testing and deployment
- Proper test configuration with Jest and passWithNoTests for clean CI
- Vite build optimization with correct base path for GitHub Pages
- Production bundle optimization (~67KB gzipped)