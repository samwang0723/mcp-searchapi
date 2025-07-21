# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Building and Running
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm run dev` - Start development server with hot reload using tsx
- `npm start` - Start production server from dist/index.js
- `npm test` - Run Jest tests
- `npm run lint` - Run ESLint on TypeScript files
- `npm run lint:fix` - Run ESLint with auto-fix
- `npm run quality` - Run type checking, linting, and format checking

### Type Checking
- `tsc` - TypeScript compiler (build command runs this)
- No dedicated type-check script, use `npm run quality`

## Architecture Overview

This is an MCP (Model Context Protocol) server built with TypeScript and Express.js that provides SearchApi.io integration.

### Core Components

1. **McpServerApp** (`src/index.ts`): Main application orchestrating the MCP server
   - Creates Express.js HTTP server
   - Manages stateful sessions with StreamableHTTPServerTransport
   - Handles POST/GET/DELETE endpoints for MCP communication
   - Implements session cleanup and error handling

2. **Configuration System** (`src/config/index.ts`):
   - Environment-based configuration with TypeScript interfaces
   - Supports PORT and LOG_LEVEL environment variables
   - TypeScript path aliases: `@config/*`, `@utils/*`

3. **Logging** (`src/utils/logger.ts`):
   - Winston-based structured logging
   - Console and file transports (error.log, combined.log)
   - Custom logger interface with getLevel/setLevel/setName methods

### MCP Server Details

- **Tool Registration**: Single `searchapi-function` tool with Zod schema validation
- **Session Management**: HTTP-based stateful sessions using session IDs
- **Transport**: StreamableHTTPServerTransport for bidirectional communication
- **Endpoints**:
  - `GET /health` - Health check
  - `POST /mcp` - Client-to-server requests
  - `GET /mcp` - Server-to-client notifications via SSE
  - `DELETE /mcp` - Session termination

### TypeScript Configuration

- ES2020 target with ESNext modules
- Path aliases configured for `@config/*` and `@utils/*`
- Strict TypeScript with comprehensive compiler options
- Source maps and declarations enabled

### Environment Setup

Create `.env` file from `.env.example`:
```env
PORT=3000
LOG_LEVEL=info
```

### ESLint Rules

- TypeScript ESLint with recommended rules
- No unused variables (error)
- No explicit any (warning)
- Prefer const over let
- No var declarations