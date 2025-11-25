# Critical Component Analysis: What's Truly Needed?

## 批判性思考：從真實應用場景倒推

> 不要從其他框架抄組件列表，要從**真實 TUI 應用的需求**倒推。

---

## Window vs Modal: 核心區別

### Modal（已有 ✅）- 阻斷式對話框

**特徵：**
- 居中顯示，有背景遮罩
- 必須處理完才能繼續
- 不可拖動、不可調整大小
- 一次只能有一個

**用例：**
```tsx
<Modal open={showConfirm} title="Confirm Delete">
  Are you sure you want to delete this file?
  <Button onClick={confirm}>Yes</Button>
  <Button onClick={cancel}>No</Button>
</Modal>
```

**應用場景：**
- ✅ 確認對話框（刪除、覆蓋）
- ✅ 警告提示
- ✅ 表單輸入
- ✅ 錯誤訊息

**結論：✅ Modal 是核心組件，已完美實現。**

---

### Window（已在 demo ✅）- 浮動窗口

**特徵：**
- 有標題欄（icon + title + minimize/maximize/close）
- 可以拖動、調整大小
- 可以多個同時存在
- z-ordering（點擊聚焦）
- 可以最小化、最大化

**實現位置：** `examples/tui-os-demo/`
- `components/Window.tsx` - 窗口組件
- `window-manager.ts` - 狀態管理
- `components/Desktop.tsx` - 桌面環境
- `components/TaskBar.tsx` - 任務欄

**用例：**
```tsx
<Window window={windowState}>
  <Terminal />
</Window>
```

**應用場景：**
- ✅ Desktop 環境演示（ZenOS）
- ✅ 教學用途
- ❌ **實際 TUI 應用幾乎不需要**

**為什麼實際應用不需要浮動窗口？**

讓我們看真實案例：

#### tmux / screen
- ❌ 不是 Window！是 **Pane** + **Session**
- 分割是**固定的**（splitter），不是浮動窗口
- 沒有標題欄、沒有拖動、沒有最小化

#### vim
- ❌ 不是 Window！是 **Split** + **Buffer**
- 分割是**固定的** `:split`, `:vsplit`
- 沒有標題欄、沒有拖動

#### ranger / nnn（文件管理器）
- ❌ 不需要 Window
- 使用**固定的 3 面板布局**（父目錄、當前目錄、預覽）

#### lazygit / tig（Git UI）
- ❌ 不需要 Window
- 使用**固定分割視圖**（commit list + diff）

#### htop / bottom（系統監控）
- ❌ 不需要 Window
- 單一全屏界面

#### midnight commander（文件管理器）
- ❌ 不需要 Window
- 固定雙面板布局

#### mutt（Email 客戶端）
- ❌ 不需要 Window
- 固定分割視圖（郵件列表 + 內容）

### 結論：Window 需求分析

**Window 在 TUI 中的使用場景：**
- ✅ Demo 項目（如 ZenOS）
- ✅ 教學展示
- ✅ 娛樂項目
- ❌ **99% 的實際 TUI 應用都不需要浮動窗口**

**為什麼？**
1. **Terminal 空間有限** - 80x24 或 120x40，浮動窗口浪費空間
2. **鍵盤優先** - TUI 應用以鍵盤為主，浮動窗口需要滑鼠
3. **固定分割更實用** - Splitter/Pane 更符合 TUI 使用習慣
4. **Modal 足夠** - 臨時交互用 Modal，持久區域用 Splitter

**決策：**
- ✅ **Window 保留在 `tui-os-demo` 作為演示**
- ❌ **不需要加入 core `@zen/tui`**
- ✅ **實際應用需要的是 Splitter/Pane（固定分割）**

---

## 真實應用場景倒推

### 場景 1: 文件管理器（ranger, nnn, midnight commander）

**需要：**
- ✅ TreeView（已有）- 文件樹
- ✅ ScrollBox（已有）- 滾動
- ✅ StatusBar（已有）- 路徑、狀態
- ⚠️ **List** - 文件列表（**缺少**）
- ⚠️ **Splitter** - 多面板布局（**缺少**）

**為什麼需要 List？**
- MultiSelect 太具體（帶 checkbox）
- 需要通用的 List（單選、無選擇、自定義渲染）

**為什麼需要 Splitter？**
- ranger 有 3 個面板（父目錄 | 當前目錄 | 預覽）
- midnight commander 有 2 個面板
- 需要固定分割，可能支持調整大小

**FileBrowser 組件？**
- ❌ 不需要獨立組件
- ✅ 用 TreeView + List 組合即可

---

### 場景 2: Git UI（lazygit, tig）

**需要：**
- ✅ ScrollBox（已有）
- ✅ StatusBar（已有）
- ⚠️ **List** - commit 列表（**缺少**）
- ⚠️ **Splitter** - commit list + diff 分割（**缺少**）

**為什麼需要 Splitter？**
- lazygit 左邊是 commit list，右邊是 diff
- 需要固定垂直分割

---

### 場景 3: 文本編輯器（vim, nano, micro）

**需要：**
- ✅ StatusBar（已有）- 行號、模式
- ✅ ScrollBox（已有）- 滾動
- ⚠️ **TextArea** - 多行文本編輯（**缺少**）
- ⚠️ **MenuBar** - 頂部菜單（nano 有）（**缺少**）
- ⚠️ **Splitter** - vim split（**缺少**）

**為什麼需要 TextArea？**
- 我們只有 TextInput（單行）
- 編輯器需要多行編輯、語法高亮、光標控制

**為什麼需要 MenuBar？**
- nano 有頂部菜單欄（File, Edit, View）
- vim 也有（:menu）

---

### 場景 4: 系統監控（htop, bottom）

**需要：**
- ✅ Table（已有）- 進程列表
- ✅ ProgressBar（已有）- CPU/Memory bar
- ✅ StatusBar（已有）
- ⚠️ **Chart** - CPU/Memory 圖表（**缺少**）
- ⚠️ **MenuBar** - F1-F10 菜單（**缺少**）

**為什麼需要 Chart？**
- htop 有 CPU/Memory 歷史圖表
- bottom 有更豐富的圖表

---

### 場景 5: IDE（VS Code TUI, Helix）

**需要：**
- ✅ TreeView（已有）- 文件樹
- ✅ Tabs（已有）- 打開的文件
- ✅ StatusBar（已有）
- ✅ CommandPalette（已有）
- ⚠️ **Splitter** - 編輯器分割、側邊欄（**缺少**）
- ⚠️ **TextArea** - 代碼編輯器（**缺少**）
- ⚠️ **MenuBar** - 頂部菜單（**缺少**）

---

### 場景 6: 聊天/Email（slack-term, mutt, aerc）

**需要：**
- ✅ ScrollBox（已有）- 聊天歷史
- ✅ TextInput（已有）- 輸入消息
- ✅ StatusBar（已有）
- ⚠️ **Splitter** - 頻道列表 + 聊天內容（**缺少**）
- ⚠️ **List** - 頻道/郵件列表（**缺少**）

---

## 組件優先級：最終結論

### P0 - 絕對必需（4 個）

#### 1. **List** ⭐⭐⭐⭐⭐
**出現頻率：** 5/6 場景

**為什麼必需：**
- 幾乎所有應用都需要列表（文件、commit、郵件、頻道、搜索結果）
- 我們有 MultiSelect，但它太具體（帶 checkbox + 多選）
- 需要通用的 List：
  - 單選模式
  - 無選擇模式（純展示）
  - 自定義渲染
  - 鍵盤導航（↑↓）
  - 滾動支持

**API 設計：**
```tsx
<List
  items={files}
  selectedIndex={selected}
  onSelect={handleSelect}
  renderItem={(item, index, isSelected) => (
    <Text color={isSelected ? 'cyan' : 'white'}>{item.name}</Text>
  )}
  // Keyboard: ↑↓ to navigate, Enter to select
/>
```

**與 MultiSelect 的區別：**
| Feature | List | MultiSelect |
|---------|------|-------------|
| Selection | Single or none | Multiple |
| Checkboxes | ❌ | ✅ |
| Space key | Select | Toggle checkbox |
| Enter key | Confirm | Submit selection |

**結論：必需，P0**

---

#### 2. **Splitter / ResizablePane** ⭐⭐⭐⭐⭐
**出現頻率：** 6/6 場景

**為什麼必需：**
- **所有複雜的 full-screen app 都需要分割視圖**
- ranger 的 3 面板
- lazygit 的 commit list + diff
- IDE 的編輯器 + 側邊欄
- Email 的郵件列表 + 內容

**API 設計：**
```tsx
<Splitter orientation="horizontal" sizes={[30, 70]}>
  <Pane minSize={20}>
    <FileTree />
  </Pane>
  <Pane>
    <Editor />
  </Pane>
</Splitter>

// 或者更簡單的固定分割
<HorizontalSplit left={30} right="flex">
  <FileTree />
  <Editor />
</HorizontalSplit>
```

**功能：**
- 水平/垂直分割
- 固定大小或百分比
- 可選：拖動調整大小（需要滑鼠）
- 嵌套支持

**結論：必需，P0，這是 full-screen app 的核心**

---

#### 3. **TextArea** ⭐⭐⭐⭐
**出現頻率：** 3/6 場景

**為什麼必需：**
- 我們只有 TextInput（單行）
- 編輯器類應用必需多行編輯
- Git commit message 編輯
- Email 撰寫
- Notepad 應用

**API 設計：**
```tsx
<TextArea
  value={content}
  onChange={setContent}
  placeholder="Enter text..."
  minHeight={10}
  maxHeight={30}
  showLineNumbers={true}
  wrap={true}
  // Advanced
  syntax="javascript"  // Optional syntax highlighting
  readOnly={false}
  onSubmit={handleSubmit}  // Ctrl+Enter
/>
```

**功能：**
- 多行文本編輯
- 光標控制（↑↓←→, Home, End, PageUp, PageDown）
- 選擇（Shift+方向鍵）
- 複製/粘貼（Ctrl+C, Ctrl+V）
- Undo/Redo（Ctrl+Z, Ctrl+Y）
- 可選：行號
- 可選：語法高亮（基礎）

**結論：必需，P0**

---

#### 4. **MenuBar** ⭐⭐⭐⭐
**出現頻率：** 4/6 場景

**為什麼必需：**
- 專業應用的標準 UI pattern
- nano 的菜單
- vim 的菜單
- htop 的 F1-F10 菜單
- midnight commander 的菜單

**API 設計：**
```tsx
<MenuBar>
  <Menu label="File" shortcut="F1">
    <MenuItem label="Open" shortcut="Ctrl+O" onSelect={handleOpen} />
    <MenuItem label="Save" shortcut="Ctrl+S" onSelect={handleSave} />
    <MenuDivider />
    <MenuItem label="Exit" shortcut="Ctrl+Q" onSelect={exit} />
  </Menu>
  <Menu label="Edit" shortcut="F2">
    <MenuItem label="Copy" shortcut="Ctrl+C" onSelect={copy} />
    <MenuItem label="Paste" shortcut="Ctrl+V" onSelect={paste} />
  </Menu>
  <Menu label="View" shortcut="F3">...</Menu>
</MenuBar>
```

**功能：**
- 頂部菜單欄
- 鍵盤導航（F1-F12 或 Alt+字母）
- 下拉菜單
- 分隔線
- 快捷鍵顯示

**結論：必需，P0**

---

### P1 - 重要但非絕對必需（2 個）

#### 5. **Chart / Graph** ⭐⭐⭐
**出現頻率：** 1/6 場景

**為什麼重要：**
- 系統監控類應用（htop, bottom）
- CPU/Memory 歷史圖表
- 網絡流量圖

**API 設計：**
```tsx
<LineChart
  data={cpuHistory}
  width={50}
  height={10}
  color="cyan"
  min={0}
  max={100}
/>

<BarChart data={[...]} />
<SparkLine data={[...]} />
```

**挑戰：**
- 實現複雜（需要 Unicode 圖形字符）
- 不是所有應用都需要

**結論：重要，P1，但可延後**

---

#### 6. **ContextMenu** ⭐⭐
**出現頻率：** 滑鼠應用

**為什麼重要：**
- 滑鼠應用的右鍵菜單
- 文件操作（複製、粘貼、刪除）

**API 設計：**
```tsx
<ContextMenu
  x={mouseX}
  y={mouseY}
  open={showMenu}
  items={[
    { label: 'Copy', shortcut: 'Ctrl+C', onSelect: copy },
    { label: 'Paste', shortcut: 'Ctrl+V', onSelect: paste },
    { type: 'divider' },
    { label: 'Delete', onSelect: del },
  ]}
/>
```

**結論：重要，P1**

---

### ❌ 不需要作為 Core 組件

#### Window（浮動窗口）
- ✅ 已在 `tui-os-demo` 實現
- ❌ 99% 的實際應用不需要
- **決策：保留在 demo，不加入 core**

#### FileBrowser
- ❌ 可以用 TreeView + List 組合
- **決策：不需要獨立組件**

#### SearchBar / FilterBar
- ❌ 太簡單，直接用 TextInput
- **決策：不需要**

#### Breadcrumbs
- ❌ 太簡單，用 Text 或 StatusBar
- **決策：不需要**

#### Drawer / Sidebar
- ❌ 用 Splitter 實現
- **決策：不需要**

#### Toolbar
- ❌ Terminal 中圖標支持有限（只有 emoji）
- ❌ 用 MenuBar 或 StatusBar 更好
- **決策：不需要**

#### Notification / NotificationCenter
- ❌ Toast 已經足夠（臨時通知）
- ❌ TUI 中不常見持久通知
- **決策：不需要**

#### Accordion
- ❌ TreeView 可以部分替代
- ❌ 不是核心需求
- **決策：P2 或不需要**

#### Pagination
- ❌ TUI 中更常用滾動（ScrollBox）
- **決策：不需要**

#### Tooltip
- ❌ TUI 中不常見
- ❌ 只有滑鼠應用才有意義
- **決策：P2**

#### LoadingOverlay / Skeleton
- ❌ Spinner + Modal 足夠
- **決策：不需要**

#### Stepper
- ❌ 不常見
- **決策：P2**

#### Form
- ❌ 可能只需要工具函數，不需要組件
- **決策：考慮工具函數而非組件**

#### Grid Layout
- ❌ Box + flexbox 足夠強大
- **決策：不需要**

#### DatePicker, TimePicker, Slider, Switch, ColorPicker
- ❌ 錦上添花，不是核心
- **決策：P2 或更低**

---

## 最終結論

### 核心組件優先級

**P0 - 立即實現（4 個）：**
1. ✅ **List** - 通用列表組件
2. ✅ **Splitter / Pane** - 固定分割視圖（full-screen app 核心）
3. ✅ **TextArea** - 多行文本編輯
4. ✅ **MenuBar** - 頂部菜單欄

**P1 - 重要（2 個）：**
5. ✅ **Chart** - 圖表（系統監控）
6. ✅ **ContextMenu** - 右鍵菜單

**決策：Window 保留在 demo**
- Window 組件已在 `tui-os-demo` 完美實現
- 不需要加入 `@zen/tui` core
- 作為演示項目展示框架能力

**不需要的組件：**
- FileBrowser, SearchBar, Breadcrumbs, Drawer, Toolbar, Notification, Accordion, Pagination, Tooltip, LoadingOverlay, Stepper, Form, Grid, DatePicker, TimePicker, Slider, Switch, ColorPicker

---

## 實施計劃

### Phase 1: P0 組件（2 週）
1. **List** - 2-3 天
2. **Splitter** - 3-4 天（最複雜）
3. **TextArea** - 3-4 天（複雜）
4. **MenuBar** - 2-3 天

### Phase 2: P1 組件（1 週）
5. **Chart** - 3-4 天
6. **ContextMenu** - 1-2 天

### Phase 3: 示例應用（1 週）
- Ranger-like file manager
- Lazygit-like git UI
- Htop-like system monitor

**Total: ~4 週達到生產就緒**

---

## 現狀總結

**Console App：100% ✅** - 已完美

**Full Screen App：**
- ✅ 基礎設施完整（FullscreenLayout, ScrollBox, Mouse, Router）
- ✅ 豐富的組件庫（38 個組件）
- ✅ Window demo 展示框架能力
- ⚠️ 缺 4 個核心組件（List, Splitter, TextArea, MenuBar）

**完成 Phase 1 後：**
- ✅✅ **可以構建任何專業的 TUI 應用**
- ✅✅ **超越所有現有 Node.js TUI 框架**
