---
description: Display current context window usage and token breakdown
---

# Context Window Usage

Display detailed information about the current context window usage, including token counts for different components.

## Your Task

Analyze and display the context window usage with the following sections:

### 1. Model Information
Show the current model being used and its token limits.

### 2. Visual Token Usage Bar
Create a visual bar chart (10 blocks wide) showing token usage breakdown using these Unicode characters:
- ⛁ (filled) - Used tokens
- ⛀ (half-filled) - Partially used blocks
- ⛶ (empty) - Reserved/System tokens
- ⛝ (light) - Free space/buffer

### 3. Token Breakdown

Calculate and display tokens for each category:

#### System Prompt
- Count tokens in the system prompt
- Show: `⛁ System prompt: X.Xk tokens (X.X%)`

#### System Tools
- Count tokens for all built-in tool definitions (filesystem, shell, search, interaction tools)
- Show: `⛁ System tools: X.Xk tokens (X.X%)`

#### MCP Tools
- Count tokens for all MCP tool definitions
- List each MCP tool with its token count
- Show: `⛁ MCP tools: X.Xk tokens (X.X%)`

#### Custom Agents
- Count tokens for custom agent definitions (if any)
- List each agent with token count
- Show: `⛁ Custom agents: X tokens (X.X%)`

#### Messages
- Count tokens in all messages in the current session
- Show: `⛁ Messages: X tokens (X.X%)`

#### Free Space
- Calculate remaining available tokens
- Show: `⛶ Free space: XXXk (XX.X%)`

#### Autocompact Buffer
- Calculate reserved buffer space (typically 22.5% of total)
- Show: `⛝ Autocompact buffer: XX.Xk tokens (XX.X%)`

### 4. Detailed Listings

Show expandable sections with details:

```
MCP tools · /mcp
└ mcp__tool_name (server-name): XXX tokens
└ ...

Custom agents · /agents
└ agent-name (Project): XX tokens
└ ...

SlashCommand Tool · X commands
└ Total: XXX tokens
```

## Display Format

Use this exact format for the output:

```
Context Usage
⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛁ ⛀ ⛁ ⛁   model-name · XXk/XXXk tokens (XX%)
⛀ ⛀ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ System prompt: X.Xk tokens (X.X%)
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ System tools: XX.Xk tokens (X.X%)
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ MCP tools: X.Xk tokens (X.X%)
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ Custom agents: XX tokens (X.X%)
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶   ⛁ Messages: XXX tokens (X.X%)
⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛶ ⛝ ⛝ ⛝   ⛶ Free space: XXXk (XX.X%)
⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝   ⛝ Autocompact buffer: XX.Xk tokens (XX.X%)
⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝ ⛝

MCP tools · /mcp
└ tool_name (server-name): XXX tokens
└ ...

Custom agents · /agents
└ agent-name (Project): XX tokens
└ ...

SlashCommand Tool · X commands
└ Total: XXX tokens
```

## Implementation Notes

1. Use the `countTokens()` utility from `src/utils/token-counter.ts` with the current session model name
2. Get current session from app store to access model name and messages
3. Get system prompt from `src/core/ai-sdk.ts` (SYSTEM_PROMPT constant)
4. Get tool definitions from `src/tools/registry.ts` (getAISDKTools())
5. Calculate percentages based on the model's max token limit (e.g., 200k for Claude Sonnet 4.5)
6. Round token counts appropriately (show decimals for k, no decimals for raw numbers)
7. Ensure the bar chart accurately represents the proportions
8. Use proper indentation and alignment for readability
