# Contributing to ScrollMeter

Thank you for your interest in contributing to ScrollMeter! We welcome contributions to improve features, documentation, extension support, and developer tooling.

## 🛠️ Development Setup

1. Fork and clone the repository:
   ```bash
   git clone https://github.com/Tawhide16/scrollmeter.git
   cd scrollmeter
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Run type-checking & lint verification:
   ```bash
   npm run lint
   ```

5. Verify production build:
   ```bash
   npm run build
   ```

## 📋 Pull Request Guidelines

1. Create a feature branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes following conventional commit syntax (`feat:`, `fix:`, `docs:`, `chore:`, `refactor:`).
3. Push to your branch and open a Pull Request against `main`.
4. Ensure all CI checks (lint, build, docker) pass before requesting a review.

## 💡 Code Standards

- Maintain privacy-first principles: no user tracking, telemetry, or remote transmission of personal browsing logs.
- Use TypeScript with strict typings wherever possible.
- Style UI components with Tailwind CSS.
