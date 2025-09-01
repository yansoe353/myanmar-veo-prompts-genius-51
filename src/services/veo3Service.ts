interface Veo3Options {
  model?: string;
  aspectRatio?: string;
  [key: string]: any;
}

interface Veo3Status {
  successFlag: number;
  resultUrls?: string;
  [key: string]: any;
}

export class Veo3Client {
  private apiKey: string;
  private baseUrl: string = 'https://api.kie.ai';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private get headers() {
    return {
      'Authorization': `Bearer ${this.apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  // Generate video
  async generateVideo(prompt: string, options: Veo3Options = {}): Promise<string> {
    const payload = {
      prompt,
      model: options.model || 'veo3',
      aspectRatio: options.aspectRatio || '16:9',
      ...options
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/v1/veo/generate`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      
      if (response.ok && data.code === 200) {
        return data.data.taskId;
      } else {
        throw new Error(`Video generation failed: ${data.msg || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Video generation failed: ${(error as Error).message}`);
    }
  }

  // Check status
  async getStatus(taskId: string): Promise<Veo3Status> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/veo/record-info?taskId=${taskId}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      
      const data = await response.json();
      
      if (response.ok && data.code === 200) {
        return data.data;
      } else {
        throw new Error(`Status check failed: ${data.msg || 'Unknown error'}`);
      }
    } catch (error) {
      throw new Error(`Status check failed: ${(error as Error).message}`);
    }
  }

  // Wait for completion with progress callback
  async waitForCompletion(
    taskId: string, 
    maxWaitTime: number = 600000, // 10 minutes
    onProgress?: (status: Veo3Status) => void
  ): Promise<string[]> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const status = await this.getStatus(taskId);
      
      if (onProgress) {
        onProgress(status);
      }
      
      if (status.successFlag === 1) {
        return JSON.parse(status.resultUrls || '[]');
      } else if (status.successFlag === 2 || status.successFlag === 3) {
        throw new Error('Video generation failed');
      }
      
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    }
    
    throw new Error('Task timeout - video generation took too long');
  }
}