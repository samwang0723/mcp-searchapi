# MCP SearchAPI Server

An MCP (Model Context Protocol) server that provides Google Shopping search capabilities using SearchAPI.io. This server allows AI assistants to search for products, compare prices, and retrieve shopping information through a standardized interface.

## 🚀 Features

- **Google Shopping Search**: Search for products with comprehensive filtering options
- **TypeScript**: Full type safety with modern TypeScript patterns
- **HTTP Transport**: RESTful API with Express.js server
- **Session Management**: Stateful connections with proper session handling
- **Configuration Management**: Environment-based configuration with validation
- **Error Handling**: Comprehensive error handling and logging
- **Health Checks**: Built-in health monitoring endpoints
- **Docker Support**: Production-ready containerization
- **Production Ready**: Optimized for scalability and security

## 📋 Prerequisites

- Node.js 20+
- npm or yarn
- SearchAPI.io API key
- Docker (optional, for containerization)

## 🛠️ Quick Start

### 1. Installation

```bash
# Clone the repository
git clone https://github.com/your-username/mcp-searchapi.git
cd mcp-searchapi

# Install dependencies
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory:

```env
# SearchAPI Configuration (Required)
SEARCHAPI_API_KEY=your_searchapi_key_here

# Server Configuration
PORT=3000
LOG_LEVEL=info
```

### 3. Get SearchAPI.io API Key

1. Visit [SearchAPI.io](https://www.searchapi.io/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to your `.env` file

### 4. Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint and format code
npm run lint
npm run lint:fix
```

## 🏗️ Project Structure

```
mcp-searchapi/
├── src/
│   ├── config/           # Configuration management
│   │   └── index.ts      # Main config file
│   ├── services/         # Service layer
│   │   └── searchapi.ts  # SearchAPI.io service
│   ├── utils/            # Utility functions
│   │   └── logger.ts     # Logging utilities
│   └── index.ts          # Main server application
├── Dockerfile            # Docker configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md            # This file
```

## 🔧 Available Tools

### Google Shopping Search

Search for products on Google Shopping with advanced filtering options.

**Tool Name**: `google-shopping-search`

**Parameters**:

- `query` (required): Search query for products (e.g., "iPhone 15", "running shoes")
- `location` (optional): Location for search results (e.g., "United States", "New York")
- `country` (optional): Country code for search results (e.g., "us", "uk", "ca")
- `language` (optional): Language code for search results (e.g., "en", "es", "fr")
- `maxResults` (optional): Maximum number of results to return (default: 10)
- `includeMetadata` (optional): Include search metadata in response (default: false)

**Example Usage**:

```json
{
  "tool": "google-shopping-search",
  "arguments": {
    "query": "wireless headphones",
    "location": "United States",
    "country": "us",
    "language": "en",
    "maxResults": 5
  }
}
```

## 🔧 Architecture

### Core Components

1. **McpServerApp**: Main application class that orchestrates the MCP server
2. **SearchApiService**: Service for interacting with SearchAPI.io
3. **Configuration**: Environment-based configuration with type safety
4. **Session Management**: HTTP-based stateful sessions with cleanup
5. **Transport Layer**: StreamableHTTPServerTransport for MCP communication
6. **Error Handling**: Comprehensive error handling with proper HTTP responses

### HTTP Endpoints

- `GET /health` - Health check endpoint
- `POST /mcp` - Main MCP communication endpoint
- `GET /mcp` - Server-to-client notifications via SSE
- `DELETE /mcp` - Session termination

## 🛠️ Configuration

### Environment Variables

| Variable            | Description                              | Default | Required |
| ------------------- | ---------------------------------------- | ------- | -------- |
| `SEARCHAPI_API_KEY` | Your SearchAPI.io API key                | -       | Yes      |
| `PORT`              | Server port                              | 3000    | No       |
| `LOG_LEVEL`         | Logging level (debug, info, warn, error) | info    | No       |

### SearchAPI.io Configuration

The server supports all SearchAPI.io Google Shopping parameters:

- **Location-based filtering**: Target specific geographical regions
- **Language preferences**: Return results in preferred languages
- **Result limiting**: Control the number of results returned
- **Metadata inclusion**: Get additional search metadata

## 🐳 Docker Deployment

### Build and Run

```bash
# Build Docker image
docker build -t mcp-searchapi-server .

# Run container
docker run -p 3000:3000 -e SEARCHAPI_API_KEY=your_key_here mcp-searchapi-server
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'
services:
  mcp-searchapi:
    build: .
    ports:
      - '3000:3000'
    environment:
      - SEARCHAPI_API_KEY=${SEARCHAPI_API_KEY}
      - NODE_ENV=production
      - PORT=3000
      - LOG_LEVEL=info
    restart: unless-stopped
    healthcheck:
      test: ['CMD', 'curl', '-f', 'http://localhost:3000/health']
      interval: 30s
      timeout: 10s
      retries: 3
```

Run with:

```bash
# Set your API key in .env file or environment
docker-compose up -d
```

## 🔗 MCP Client Integration

### Using with Claude Desktop

Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "mcp-searchapi": {
      "name": "mcp-searchapi",
      "type": "streamable-http",
      "streamable": true,
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

### Using with Custom MCP Clients

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'searchapi-client',
  version: '1.0.0',
});

// Connect to the server
await client.connect(transport);

// Use the Google Shopping search tool
const result = await client.callTool('google-shopping-search', {
  query: 'laptop',
  maxResults: 5,
});
```

## 🔒 Security Best Practices

- **API Key Security**: Store your SearchAPI.io API key securely
- **Input Validation**: All parameters are validated using Zod schemas
- **Error Handling**: Safe error responses without information leakage
- **Session Management**: Proper session cleanup and validation
- **Rate Limiting**: Consider implementing rate limiting for production use

## 📊 Monitoring and Logging

The server includes comprehensive logging for:

- Search requests and responses
- Error tracking and debugging
- Session management events
- Health check status

Logs are structured JSON format suitable for production monitoring systems.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Test the health endpoint
curl http://localhost:3000/health
```

## 🚀 Production Deployment

### Environment Variables

```env
NODE_ENV=production
SEARCHAPI_API_KEY=your_production_api_key
PORT=3000
LOG_LEVEL=warn
```

### Performance Considerations

- Monitor API rate limits from SearchAPI.io
- Implement caching for frequently searched queries
- Set up proper log rotation
- Monitor memory usage and implement limits

## 📚 API Documentation

### SearchAPI.io Integration

This server integrates with [SearchAPI.io](https://www.searchapi.io/) Google Shopping API. For detailed API documentation and pricing information, visit their documentation.

### MCP Protocol

This server implements the [Model Context Protocol](https://modelcontextprotocol.io/) specification for standardized AI assistant integration.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For questions and support:

- Check the [MCP Documentation](https://modelcontextprotocol.io/)
- Review [SearchAPI.io Documentation](https://www.searchapi.io/docs)
- Create an issue with detailed information

---

**Start searching for products with AI! 🛍️**
