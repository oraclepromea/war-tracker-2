export interface HealthEndpoint {
  name: string;
  url: string;
  status: 'healthy' | 'error';
  lastChecked: string;
}

export class SystemHealthManager {
  private endpoints: HealthEndpoint[];

  constructor(endpoints: HealthEndpoint[]) {
    this.endpoints = endpoints;
  }

  public async checkHealth(): Promise<void> {
    await Promise.all(this.endpoints.map(endpoint => this.checkEndpointHealth(endpoint)));
  }

  private async checkEndpointHealth(endpoint: HealthEndpoint): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}${endpoint.url}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      clearTimeout(timeoutId);
      endpoint.status = response.ok ? 'healthy' : 'error';
      endpoint.lastChecked = new Date().toISOString();

    } catch (error) {
      endpoint.status = 'error';
      endpoint.lastChecked = new Date().toISOString();
      console.warn(`Health check failed for ${endpoint.name}:`, error);
    }
  }
}