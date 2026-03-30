/**
 * Mock API service for admin operations
 * This will be replaced with real Cloudflare Worker API calls once backend is ready
 */

export interface Destination {
  id: string;
  name: string;
  description: string;
  lat: number;
  lng: number;
  continent: string;
  continentEmoji: string;
  visitDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  destinationId: string;
  url: string;
  caption: string;
  visible: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDestinationDto {
  name: string;
  description: string;
  lat: number;
  lng: number;
  continent: string;
  continentEmoji: string;
  visitDate: string;
}

export interface UpdateDestinationDto extends Partial<CreateDestinationDto> {}

export interface UploadPhotoDto {
  destinationId: string;
  file: File;
  caption?: string;
}

export interface UpdatePhotoDto {
  caption?: string;
  visible?: boolean;
  order?: number;
}

class ApiService {
  private getStoredAuth(): { token: string; expiresAt: number } | null {
    const authData = localStorage.getItem('admin-auth');
    if (!authData) return null;
    try {
      return JSON.parse(authData);
    } catch {
      return null;
    }
  }

  private setStoredAuth(token: string, expiresAt: number): void {
    localStorage.setItem('admin-auth', JSON.stringify({ token, expiresAt }));
  }

  private clearStoredAuth(): void {
    localStorage.removeItem('admin-auth');
  }

  private isTokenValid(authData: { token: string; expiresAt: number } | null): boolean {
    if (!authData) return false;
    return Date.now() < authData.expiresAt;
  }

  async checkAuth(): Promise<boolean> {
    const authData = this.getStoredAuth();
    
    // Check if token exists and is not expired
    if (!this.isTokenValid(authData)) {
      this.clearStoredAuth();
      return false;
    }

    // In production: verify JWT signature with Cloudflare Access public key
    // For now, mock verification
    return authData!.token === 'mock-admin-token';
  }

  async login(accessToken: string): Promise<void> {
    // Mock: In production, Cloudflare Access will provide a JWT
    // We would decode and validate the JWT here
    if (accessToken === 'mock-admin-token') {
      // Mock: 1 hour expiration
      const expiresAt = Date.now() + 60 * 60 * 1000;
      this.setStoredAuth(accessToken, expiresAt);
    } else {
      throw new Error('Invalid access token');
    }
  }

  async logout(): Promise<void> {
    this.clearStoredAuth();
  }

  // Destinations CRUD
  async getDestinations(): Promise<Destination[]> {
    // Mock: return empty array for now
    // In production: GET /api/v1/destinations
    await this.delay(300);
    return [];
  }

  async getDestination(_id: string): Promise<Destination> {
    // Mock
    // In production: GET /api/v1/destinations/:id
    await this.delay(200);
    throw new Error('Not implemented yet');
  }

  async createDestination(dto: CreateDestinationDto): Promise<Destination> {
    this.requireAuth();
    // Mock
    // In production: POST /api/v1/admin/destinations
    await this.delay(400);
    const now = new Date().toISOString();
    return {
      id: `dest-${Date.now()}`,
      ...dto,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updateDestination(_id: string, _dto: UpdateDestinationDto): Promise<Destination> {
    this.requireAuth();
    // Mock
    // In production: PATCH /api/v1/admin/destinations/:id
    await this.delay(400);
    throw new Error('Not implemented yet');
  }

  async deleteDestination(_id: string): Promise<void> {
    this.requireAuth();
    // Mock
    // In production: DELETE /api/v1/admin/destinations/:id
    await this.delay(300);
  }

  // Photos CRUD
  async getPhotos(_destinationId?: string): Promise<Photo[]> {
    // Mock
    // In production: GET /api/v1/photos?destinationId=xxx
    await this.delay(300);
    return [];
  }

  async uploadPhoto(dto: UploadPhotoDto): Promise<Photo> {
    this.requireAuth();
    // Mock
    // In production: POST /api/v1/admin/photos (multipart/form-data to R2)
    await this.delay(800);
    const now = new Date().toISOString();
    
    // Note: Caller is responsible for revoking blob URLs when done
    // to prevent memory leaks
    return {
      id: `photo-${Date.now()}`,
      destinationId: dto.destinationId,
      url: URL.createObjectURL(dto.file), // Temporary local URL - must be revoked by caller
      caption: dto.caption || '',
      visible: true,
      order: 0,
      createdAt: now,
      updatedAt: now,
    };
  }

  async updatePhoto(_id: string, _dto: UpdatePhotoDto): Promise<Photo> {
    this.requireAuth();
    // Mock
    // In production: PATCH /api/v1/admin/photos/:id
    await this.delay(300);
    throw new Error('Not implemented yet');
  }

  async deletePhoto(_id: string): Promise<void> {
    this.requireAuth();
    // Mock
    // In production: DELETE /api/v1/admin/photos/:id
    await this.delay(300);
  }

  async reorderPhotos(_destinationId: string, _photoIds: string[]): Promise<void> {
    this.requireAuth();
    // Mock
    // In production: POST /api/v1/admin/destinations/:id/photos/reorder
    await this.delay(400);
  }

  // Helpers
  private requireAuth(): void {
    const authData = this.getStoredAuth();
    if (!this.isTokenValid(authData)) {
      this.clearStoredAuth();
      throw new Error('Authentication required');
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const api = new ApiService();
