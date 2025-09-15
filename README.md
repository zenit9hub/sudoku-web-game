# 🧩 Sudoku Web Game

A modern, interactive Sudoku game built with TypeScript and Canvas API, featuring Domain-Driven Design (DDD) architecture for maximum maintainability and extensibility.

## ✨ Features

- 🎮 **Fully Interactive Gameplay**: Click-to-select cells with intuitive number input
- 🎨 **Beautiful Canvas Rendering**: Smooth 60fps rendering with visual effects
- 🧠 **Smart Number Highlighting**: Automatically highlights matching numbers across the board
- 🎯 **Advanced Selection Effects**: Row/column highlighting with elegant visual feedback
- 🎲 **Random Puzzle Generation**: Advanced algorithms ensure unique, solvable puzzles every time
- 📱 **Responsive Design**: Optimized for various screen sizes
- 🏗️ **Clean DDD Architecture**: Domain-Driven Design for future extensibility
- ⚡ **High Performance**: Optimized rendering with specialized renderer classes

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

1. Click on any empty cell to select it
2. Use the number pad or keyboard (1-9) to enter numbers
3. Click "Hint" if you get stuck
4. Use "Reset" to start over
5. Complete all cells to win!

## 🎨 Visual Features

- **Selection Highlighting**: Selected cell shows with blue border
- **Row/Column Highlighting**: Related cells highlighted in blue
- **Number Matching**: Same numbers glow in orange/turquoise
- **3x3 Grid Emphasis**: Bold borders separate sub-grids
- **Error Indication**: Invalid moves highlighted in red

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

**🔗 Live Demo**: [Coming Soon]

**📧 Contact**: [Your Contact Information]