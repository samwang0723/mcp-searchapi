#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import {
  TextContent,
  isInitializeRequest,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import config from './config/index.js';
import SearchApiService from './services/searchapi.js';
import logger from './utils/logger.js';

// Load environment variables
dotenv.config();

class McpServerApp {
  private searchApiService: SearchApiService;

  constructor() {
    if (!config.searchApi.apiKey) {
      throw new Error('SEARCHAPI_API_KEY environment variable is required');
    }
    this.searchApiService = new SearchApiService(config.searchApi.apiKey);
  }

  private createServer(): McpServer {
    const server = new McpServer({
      name: 'mcp-searchapi-server',
      version: '1.0.0',
    });

    // Register Google Shopping search tool
    server.tool(
      'google-shopping-search',
      'Search for products on Google Shopping using SearchAPI.io',
      {
        query: z
          .string()
          .describe(
            'Search query for products (e.g., "iPhone 15", "running shoes")'
          ),
        location: z
          .string()
          .optional()
          .describe(
            'Location for search results (e.g., "United States", "New York")'
          ),
        country: z
          .string()
          .optional()
          .describe('Country code for search results (e.g., "us", "uk", "ca")'),
        language: z
          .string()
          .optional()
          .describe(
            'Language code for search results (e.g., "en", "es", "fr")'
          ),
        maxResults: z
          .number()
          .default(10)
          .optional()
          .describe('Maximum number of results to return (default: 10)'),
        includeMetadata: z
          .boolean()
          .default(false)
          .optional()
          .describe('Include search metadata in response (default: false)'),
      },
      async ({
        query,
        location,
        country,
        language,
        maxResults,
        includeMetadata,
      }) => {
        try {
          logger.info('Processing Google Shopping search request', {
            query,
            location,
            country,
          });

          const searchOptions = {
            location: location || 'United States',
            gl: country || 'us',
            hl: language || 'en',
            num: maxResults || 10,
          };

          if (includeMetadata) {
            const fullResponse =
              await this.searchApiService.searchProductsWithMetadata(
                query,
                searchOptions
              );
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(fullResponse, null, 2),
                } as TextContent,
              ],
            };
          } else {
            const results = await this.searchApiService.searchProducts(
              query,
              searchOptions
            );

            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(results, null, 2),
                } as TextContent,
              ],
            };
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : String(error);
          logger.error('Google Shopping search failed', {
            query,
            error: errorMessage,
          });
          throw new Error(`Google Shopping search failed: ${errorMessage}`);
        }
      }
    );

    return server;
  }

  async run() {
    const app = express();
    app.use(express.json());

    // Map to store transports by session ID for stateful connections
    const transports: { [sessionId: string]: StreamableHTTPServerTransport } =
      {};

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ status: 'ok', service: 'mcp-searchapi-server' });
    });

    // Handle POST requests for client-to-server communication
    app.post('/mcp', async (req, res) => {
      try {
        // Check for existing session ID
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;
        let server: McpServer;

        if (sessionId && transports[sessionId]) {
          // Reuse existing transport
          transport = transports[sessionId];
        } else if (!sessionId && isInitializeRequest(req.body)) {
          // New initialization request
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: sessionId => {
              // Store the transport by session ID
              transports[sessionId] = transport;
            },
          });

          // Clean up transport when closed
          transport.onclose = () => {
            if (transport.sessionId) {
              delete transports[transport.sessionId];
            }
          };

          // Create new server instance
          server = this.createServer();

          // Connect to the MCP server
          await server.connect(transport);
        } else {
          // Invalid request
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Bad Request: No valid session ID provided',
            },
            id: null,
          });
          return;
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
      } catch (error) {
        logger.error('Error handling MCP request', {
          error: error instanceof Error ? error.message : String(error),
        });
        if (!res.headersSent) {
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32603,
              message: 'Internal server error',
            },
            id: null,
          });
        }
      }
    });

    // Reusable handler for GET and DELETE requests
    const handleSessionRequest = async (
      req: express.Request,
      res: express.Response
    ) => {
      const sessionId = req.headers['mcp-session-id'] as string | undefined;
      if (!sessionId || !transports[sessionId]) {
        res.status(400).send('Invalid or missing session ID');
        return;
      }

      const transport = transports[sessionId];
      await transport.handleRequest(req, res);
    };

    // Handle GET requests for server-to-client notifications via SSE
    app.get('/mcp', handleSessionRequest);

    // Handle DELETE requests for session termination
    app.delete('/mcp', handleSessionRequest);

    // Start the server
    app.listen(config.server.port, '0.0.0.0', () => {
      logger.info('MCP SearchAPI Server started', {
        port: config.server.port,
        endpoints: {
          health: `http://0.0.0.0:${config.server.port}/health`,
          mcp: `http://0.0.0.0:${config.server.port}/mcp`,
        },
      });
    });
  }
}

// Start the server
const server = new McpServerApp();
server.run().catch(error => {
  logger.error('Failed to start server', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down server...');
  process.exit(0);
});
