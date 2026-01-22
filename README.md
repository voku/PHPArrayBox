# PHP Array Box 📦

<div align="center">
  <img src="https://img.shields.io/badge/PHP-Array_Architecture-5F3EC6?style=for-the-badge&logo=php" alt="PHP Array Architecture" />
  <img src="https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=for-the-badge&logo=vite" alt="Vite" />
</div>

## 🎯 Overview

**PHP Array Box** is an interactive web application for designing, analyzing, and optimizing PHP array structures. It provides real-time feedback on code smells, generates clean PHP code, and helps developers create better data structures.

### Key Features

- 🏗️ **Visual Array Builder** - Intuitive drag-and-drop interface for building complex array structures
- 🔍 **Code Smell Detection** - Real-time analysis with scoring system (0-100)
- 📝 **PHP Code Generation** - Automatically generates clean, modern PHP 8.2+ code
- 🎨 **DTO/Class Generation** - Convert arrays to typed DTOs and readonly classes
- 📊 **3D Visualization** - Interactive 3D representation of array structures
- 🔄 **Import/Export** - Import existing PHP arrays and export optimized code
- 🎭 **Presets** - Quick-start templates for common patterns

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ and npm

### Installation

```bash
# Clone the repository
git clone https://github.com/voku/PHPArrayBox.git
cd PHPArrayBox

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build for Production

```bash
# Build the application
npm run build

# Preview production build
npm run preview
```

The built files will be in the `dist/` directory.

## 📚 Usage Guide

### Building Arrays

1. **Add Elements**: Use the "+" button to add new elements to your array
2. **Configure Keys**: Set keys for associative arrays or use numeric indices
3. **Nest Arrays**: Create nested structures by adding array-type elements
4. **Set Types**: Choose from string, integer, float, boolean, or null types

### Analyzing Code Smells

The smell detector evaluates your array structure based on:

- **Depth** - Deeply nested arrays are harder to maintain
- **Complexity** - Number of elements and branches
- **Consistency** - Uniform key types and naming conventions
- **Type Safety** - Mixed types can lead to bugs

**Score Ranges:**
- 🟢 **90-100**: Excellent - Clean, maintainable structure
- 🟡 **70-89**: Good - Minor improvements possible
- 🟠 **50-69**: Fair - Consider refactoring
- 🔴 **0-49**: Poor - Significant refactoring needed

### Importing PHP Code

1. Click the "Import PHP" button
2. Paste your PHP array code (e.g., `['key' => 'value', ...]`)
3. The tool will parse and visualize your structure
4. Review suggestions and make improvements

### Generating Output

The tool generates three formats:

1. **PHP Array** - Standard PHP array syntax
2. **PHP DTO** - Typed Data Transfer Object with readonly properties
3. **JSON** - For API responses or configuration files

## 🗂️ Project Structure

### Key Files

```
PHPArrayBox/
├── index.html              # Entry point for the webapp
├── App.tsx                 # Main React application component
├── ArrayBuilder.tsx        # Core array builder logic
├── components/             # React components
│   ├── ArrayBuilder.tsx    # Array structure editor
│   ├── CodeOutput.tsx      # Code generation display
│   ├── SmellMeter.tsx      # Code smell analysis UI
│   ├── ImportModal.tsx     # PHP import functionality
│   └── Array3DVisualizer.tsx # 3D visualization
├── services/               # Business logic
│   ├── analysisService.ts  # Code smell detection
│   ├── phpGenerator.ts     # PHP code generation
│   ├── dtoGenerator.ts     # DTO/class generation
│   └── phpImportService.ts # PHP parsing
├── types.ts                # TypeScript type definitions
├── constants.ts            # App constants and presets
└── vite.config.ts          # Vite configuration
```

### Key Files Detector Prompt

Use this prompt with AI assistants to quickly identify important files in the project:

```
Analyze this React/TypeScript project and identify:
1. Entry points (HTML, main TypeScript files)
2. Core components that handle the primary functionality
3. Service layers for business logic
4. Configuration files for build and deployment
5. Type definitions and constants

Focus on files that would need modification for:
- Adding new features
- Changing the UI
- Modifying data structures
- Updating build/deployment process
```

## 🛠️ Development

### Available Scripts

```bash
npm run dev      # Start development server (port 3000)
npm run build    # Build for production
npm run preview  # Preview production build
```

### Tech Stack

- **Frontend**: React 18.2, TypeScript 5.8
- **Build Tool**: Vite 6.2
- **Styling**: Tailwind CSS (via CDN)
- **Icons**: Lucide React
- **3D Graphics**: Three.js, React Three Fiber
- **Code Highlighting**: Prism.js

### Code Style

- Use TypeScript for type safety
- Follow React hooks best practices
- Keep components focused and reusable
- Use meaningful variable and function names
- Add comments for complex logic

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository**: https://github.com/voku/PHPArrayBox
2. **Create a feature branch**: `git checkout -b feature/my-feature`
3. **Make your changes**: Follow the existing code style
4. **Test thoroughly**: Ensure all functionality works
5. **Submit a pull request**: Describe your changes clearly

### Contribution Guidelines

- Write clear commit messages
- Update documentation for new features
- Add tests for new functionality (when applicable)
- Ensure the build passes: `npm run build`
- Keep changes focused and minimal

## 📄 License

This project is open source. See the repository for license details.

## 🔗 Links

- **Repository**: https://github.com/voku/PHPArrayBox
- **Issues**: https://github.com/voku/PHPArrayBox/issues
- **Discussions**: https://github.com/voku/PHPArrayBox/discussions

## 🙏 Acknowledgments

Built with modern web technologies to help PHP developers write better code.

---

<div align="center">
  Made with ❤️ for the PHP community
</div>
