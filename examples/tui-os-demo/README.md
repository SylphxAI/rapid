# ZenOS - TUI Desktop Demo

A macOS/Windows-like desktop environment built entirely with `@rapid/tui` to demonstrate the framework's capabilities.

![ZenOS Demo](./screenshot.png)

## Features

- **Desktop Environment**
  - Menu bar with system tray
  - Desktop icons (click to open apps)
  - TaskBar showing running applications
  - Window z-ordering (click to focus)

- **Window Management**
  - Multiple windows
  - Minimize, maximize, close buttons
  - Window focus with visual feedback
  - Keyboard shortcuts

- **Built-in Apps**
  - 🖥️ **Terminal** - Fake shell with commands (help, ls, neofetch, etc.)
  - 📁 **File Manager** - Navigate directories with keyboard
  - 🧮 **Calculator** - Functional calculator with keyboard input
  - ⚙️ **Settings** - Toggle system preferences
  - ℹ️ **About** - System information
  - 📝 **Notepad** - Simple text editor

## Running

```bash
cd examples/tui-os-demo
bun run start
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+Q` | Exit ZenOS |
| `Alt+T` | Open Terminal |
| `Alt+F` | Open Files |
| `Alt+C` | Open Calculator |
| `Escape` | Close focused window |
| `↑↓` | Navigate lists in apps |
| `Enter` | Select/activate |
| `Space` | Toggle in Settings |

## Architecture

```
src/
├── main.tsx              # Entry point, ZenOS component
├── window-manager.ts     # Window state management
├── components/
│   ├── Window.tsx        # Draggable window component
│   ├── Desktop.tsx       # Desktop with icons
│   └── TaskBar.tsx       # Bottom task bar
└── apps/
    ├── Terminal.tsx      # Fake terminal
    ├── Calculator.tsx    # Calculator app
    ├── Files.tsx         # File manager
    ├── Settings.tsx      # Settings panel
    ├── About.tsx         # About dialog
    └── Notepad.tsx       # Text editor
```

## Demonstrates

This demo showcases:

1. **Fine-grained Reactivity** - Only affected parts of the UI update
2. **Component Composition** - Complex UIs from simple primitives
3. **State Management** - Signals for reactive state
4. **Event Handling** - Mouse clicks and keyboard input
5. **Layout System** - Flexbox + absolute positioning
6. **Styling** - Colors, borders, backgrounds

## Tech Stack

- `@rapid/tui` - Terminal UI framework
- `@rapid/signal` - Reactive signals
- Bun runtime

---

Built with ❤️ to showcase `@rapid/tui` capabilities.
