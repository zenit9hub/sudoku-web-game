# 🧩 Sudoku Web Game

A modern, interactive Sudoku game built with TypeScript and Canvas API, featuring Domain-Driven Design (DDD) architecture and professional mobile app-style UI.

## ✨ Features

### 🎮 Core Gameplay
- **Fully Interactive Gameplay**: Click-to-select cells with intuitive number input
- **Smart Number Highlighting**: Automatically highlights matching numbers across the board
- **Advanced Selection Effects**: Row/column highlighting with elegant visual feedback
- **Random Puzzle Generation**: Advanced algorithms ensure unique, solvable puzzles every time

### 🎨 Modern UI/UX
- **Mobile App-Style Interface**: Professional header with navigation and action buttons
- **Real-time Game Info**: Score tracking, timer, difficulty display, and mistake counter
- **Interactive Toolbar**: Quick access to undo, clear, notes, and hint functions
- **Number Pad with Counters**: Visual remaining count for each number (1-9)
- **Progress Tracking**: Visual completion indicators and status displays

### 🔧 Technical Excellence
- **Beautiful Canvas Rendering**: Smooth 60fps rendering with visual effects
- **Responsive Design**: Optimized for various screen sizes
- **Clean DDD Architecture**: Domain-Driven Design for future extensibility
- **High Performance**: Optimized rendering with specialized renderer classes
- **GitHub Pages Deployment**: Automated CI/CD with comprehensive testing

## 🎯 Difficulty Levels

- **Easy**: Perfect for beginners (40-44 given numbers)
- **Medium**: Balanced challenge (38-42 given numbers)  
- **Hard**: For experienced players (27-33 given numbers)
- **Expert**: Ultimate challenge (17-26 given numbers)

## 🛠️ Tech Stack

- **TypeScript**: Type-safe development
- **HTML5 Canvas**: High-performance 2D rendering
- **Vite**: Fast build tool and dev server
- **Jest**: Comprehensive testing framework
- **Domain-Driven Design**: Clean architecture patterns

## 🏗️ Architecture

```
src/
├── domain/           # Core business logic
│   ├── models/       # Entities and Value Objects
│   └── services/     # Domain Services
├── application/      # Use Cases and Application Services
├── infrastructure/   # External concerns (Storage, etc.)
└── presentation/     # UI Layer
    └── renderers/    # Specialized rendering classes
```

## 🚀 Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```

3. **Run tests**:
   ```bash
   npm test
   ```

4. **Build for production**:
   ```bash
   npm run build
   ```

## 🎮 How to Play

### 🎯 Game Controls
1. **Select Cells**: Click on any empty cell to select it
2. **Enter Numbers**: Use the bottom number pad or keyboard (1-9)
3. **Game Actions**: Use the toolbar for undo, clear, notes, and hints
4. **Navigation**: Use header buttons for settings, themes, and more

### 📊 Game Interface
- **Header Bar**: Back button, title, and action icons (⭐ 📝 🎨 ⚙️)
- **Game Info**: Real-time score, difficulty, mistakes counter, and timer
- **Interactive Grid**: Canvas-based Sudoku board with visual feedback
- **Toolbar**: Four main actions - Undo, Clear, Notes (ON/OFF), Hints (counter)
- **Number Pad**: Visual number input with remaining count for each digit
- **Progress**: Live completion tracking and game statistics

## 🎨 Visual Features

- **Professional Mobile UI**: App-style interface with clean, modern design
- **Smart Visual Feedback**:
  - Selected cell highlighted with blue border
  - Row/column highlighting in blue
  - Number matching in orange/turquoise
  - Bold borders separating 3x3 sub-grids
  - Error indication in red
- **Status Indicators**:
  - Mistake counter: "실패: 0 / 3"
  - Difficulty display with color coding
  - Real-time timer in monospace font
  - Progress tracking: "0/81" completion
- **Responsive Layout**: Optimized for desktop and mobile devices

## 🧪 Testing

The project includes comprehensive tests covering:
- Domain model validation
- Business logic verification  
- Sudoku generation algorithms
- Game state management

Run tests with coverage:
```bash
npm run test:coverage
```

## 📦 Build & Deployment

Production build creates optimized bundle:
```bash
npm run build
npm run preview  # Preview production build
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web standards and best practices
- Inspired by classic Sudoku puzzle design
- Implements proven software architecture patterns

---

**🔗 Live Demo**: [GitHub Pages](https://zenit.github.io/sudoku-web-game/)

**📧 Contact**: For questions or contributions