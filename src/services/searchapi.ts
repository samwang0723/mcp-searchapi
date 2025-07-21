import axios, { AxiosResponse } from 'axios';
import logger from '../utils/logger.js';

export interface InstallmentInfo {
  down_payment: string;
  extracted_down_payment: number;
  months: string;
  extracted_months: number;
  cost_per_month: string;
  extracted_cost_per_month: number;
}

export interface ShoppingResult {
  position: number;
  product_id: string;
  title: string;
  product_link: string;
  seller: string;
  offers: string;
  extracted_offers: number;
  offers_link: string;
  price: string;
  extracted_price: number;
  installment?: InstallmentInfo;
  rating?: number;
  reviews?: number;
  delivery?: string;
  thumbnail: string;
}

export interface SearchApiResponse {
  shopping_results: ShoppingResult[];
  search_metadata?: {
    id: string;
    status: string;
    json_endpoint: string;
    created_at: string;
    processed_at: string;
    google_shopping_url: string;
    raw_html_file: string;
    total_time_taken: number;
  };
  search_parameters?: {
    engine: string;
    q: string;
    gl: string;
    hl: string;
    location: string;
  };
  search_information?: {
    total_results: number;
    time_taken_displayed: number;
    query_displayed: string;
  };
}

export interface GoogleShoppingSearchParams {
  q: string;
  gl?: string;
  hl?: string;
  location?: string;
  start?: number;
  num?: number;
  tbm?: string;
  tbs?: string;
  safe?: string;
  nfpr?: string;
  filter?: string;
}

export class SearchApiService {
  private readonly baseUrl = 'https://www.searchapi.io/api/v1/search';
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    logger.info('SearchAPI service initialized');
  }

  async googleShoppingSSearch(
    params: GoogleShoppingSearchParams
  ): Promise<SearchApiResponse> {
    try {
      logger.info('Starting Google Shopping search', { query: params.q });

      const searchParams = {
        engine: 'google_shopping',
        api_key: this.apiKey,
        ...params,
      };

      const response: AxiosResponse<SearchApiResponse> = await axios.get(
        this.baseUrl,
        {
          params: searchParams,
          timeout: 30000,
          headers: {
            'User-Agent': 'MCP-SearchAPI-Server/1.0.0',
          },
        }
      );

      logger.info('Google Shopping search completed successfully', {
        query: params.q,
        resultsCount: response.data.shopping_results?.length || 0,
        status: response.status,
      });

      return response.data;
    } catch (error) {
      logger.error('Google Shopping search failed', {
        query: params.q,
        error: error instanceof Error ? error.message : String(error),
      });

      if (axios.isAxiosError(error)) {
        if (error.response) {
          throw new Error(
            `SearchAPI request failed with status ${error.response.status}: ${
              error.response.data?.message || error.response.statusText
            }`
          );
        } else if (error.request) {
          throw new Error('SearchAPI request failed: No response received');
        }
      }

      throw new Error(
        `SearchAPI request failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async searchProducts(
    query: string,
    options: Omit<GoogleShoppingSearchParams, 'q'> = {}
  ): Promise<ShoppingResult[]> {
    const searchParams: GoogleShoppingSearchParams = {
      q: query,
      gl: options.gl || 'us',
      hl: options.hl || 'en',
      location: options.location || 'United States',
      ...options,
    };

    const response = await this.googleShoppingSSearch(searchParams);
    return response.shopping_results || [];
  }

  async searchProductsWithMetadata(
    query: string,
    options: Omit<GoogleShoppingSearchParams, 'q'> = {}
  ): Promise<SearchApiResponse> {
    const searchParams: GoogleShoppingSearchParams = {
      q: query,
      gl: options.gl || 'us',
      hl: options.hl || 'en',
      location: options.location || 'United States',
      ...options,
    };

    return await this.googleShoppingSSearch(searchParams);
  }

  formatShoppingResults(results: ShoppingResult[]): string {
    if (!results || results.length === 0) {
      return 'No shopping results found.';
    }

    return results
      .map((result, index) => {
        const lines = [
          `${index + 1}. **${result.title}**`,
          `   Seller: ${result.seller}`,
          `   Price: ${result.price}`,
        ];

        if (result.rating) {
          lines.push(
            `   Rating: ${result.rating}/5 (${result.reviews?.toLocaleString() || 0} reviews)`
          );
        }

        if (result.delivery) {
          lines.push(`   Delivery: ${result.delivery}`);
        }

        if (result.installment) {
          lines.push(
            `   Installment: ${result.installment.down_payment} + ${result.installment.cost_per_month} for ${result.installment.months} months`
          );
        }

        lines.push(`   Product Link: ${result.product_link}`);
        lines.push(`   Offers: ${result.offers} available`);

        return lines.join('\n');
      })
      .join('\n\n');
  }
}

export default SearchApiService;
