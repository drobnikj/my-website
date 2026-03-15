# Admin API Documentation

This document describes the admin API endpoints for managing destinations and photos.

## Authentication

All admin endpoints (`/admin/*`) require authentication via one of:

1. **Cloudflare Access JWT** — Cookie-based authentication via Cloudflare Access
2. **API Key** — Bearer token in `Authorization` header

### Environment Variables

Configure these in Cloudflare Pages > Settings > Environment variables:

- `CF_ACCESS_TEAM_DOMAIN` — Your Cloudflare Access team domain (e.g., `myteam`)
- `ADMIN_API_KEY` — Secret API key for programmatic access

### Using API Key

Include the API key in requests:

```bash
curl -X POST https://example.com/admin/destinations \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"id": "..."}'
```

## Endpoints

### Destinations

#### POST /admin/destinations

Create a new destination.

**Request body:**

```json
{
  "id": "bali",
  "name_en": "Bali",
  "name_cs": "Bali",
  "description_en": "Island of Gods",
  "description_cs": "Ostrov bohů",
  "lat": -8.3405,
  "lng": 115.0920,
  "continent": "Asia",
  "visited_at_year": 2024,
  "visited_from": "2024-02-15",
  "visited_to": "2024-02-28"
}
```

**Response (201):**

```json
{
  "data": {
    "id": "bali",
    "name_en": "Bali",
    "name_cs": "Bali",
    "description_en": "Island of Gods",
    "description_cs": "Ostrov bohů",
    "lat": -8.3405,
    "lng": 115.0920,
    "continent": "Asia",
    "visited_at_year": 2024,
    "visited_from": "2024-02-15",
    "visited_to": "2024-02-28",
    "created_at": "2024-03-15T10:30:00Z",
    "updated_at": "2024-03-15T10:30:00Z"
  }
}
```

**Validation:**

- `id`: lowercase letters, numbers, hyphens only (required)
- `name_en`, `name_cs`, `description_en`, `description_cs`: non-empty strings (required)
- `lat`: number between -90 and 90 (required)
- `lng`: number between -180 and 180 (required)
- `continent`: one of: Africa, Asia, Europe, North America, South America, Oceania, Antarctica (required)
- `visited_at_year`: integer between 1900 and 2100 (required)
- `visited_from`, `visited_to`: ISO date strings (optional)

#### PATCH /admin/destinations/:id

Update destination fields. Only provided fields are updated.

**Request body (all fields optional):**

```json
{
  "name_en": "Bali - Updated",
  "description_en": "Updated description",
  "lat": -8.5,
  "visited_at_year": 2023
}
```

**Response (200):**

```json
{
  "data": {
    "id": "bali",
    "name_en": "Bali - Updated",
    ...
  }
}
```

#### DELETE /admin/destinations/:id

Delete destination and cascade delete all associated photos from D1 and R2.

**Response (200):**

```json
{
  "message": "Destination deleted",
  "deletedPhotos": 5
}
```

### Photos

#### POST /admin/photos/upload

Upload a new photo with automatic thumbnail and blur variant generation.

**Request:** Multipart form data

- `image` (file): Image file (JPEG, PNG, WebP, etc.)
- `destination_id` (string): Destination ID (required)
- `caption_en` (string): English caption (optional)
- `caption_cs` (string): Czech caption (optional)
- `sort_order` (number): Display order, default 0 (optional)
- `is_visible` (string): "true" or "false", default "true" (optional)

**Example:**

```bash
curl -X POST https://example.com/admin/photos/upload \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -F "image=@photo.jpg" \
  -F "destination_id=bali" \
  -F "caption_en=Beautiful sunset" \
  -F "sort_order=1"
```

**Response (201):**

```json
{
  "data": {
    "id": "bali-1710501000-abc123",
    "destination_id": "bali",
    "full_url": "bali/bali-1710501000-abc123.jpg",
    "thumb_url": "bali/bali-1710501000-abc123-thumb.jpg",
    "blur_url": "data:image/svg+xml;base64,...",
    "caption_en": "Beautiful sunset",
    "caption_cs": null,
    "sort_order": 1,
    "is_visible": 1,
    "created_at": "2024-03-15T10:30:00Z"
  }
}
```

**Image Processing:**

The endpoint automatically generates:
- **Full image**: Original uploaded image
- **Thumbnail**: Resized version (~400px width)
- **Blur placeholder**: Tiny base64-encoded blur image for lazy loading

⚠️ **Note:** Current implementation uses basic processing. For production, consider integrating:
- [Cloudflare Images](https://developers.cloudflare.com/images/) for automatic resizing
- [sharp.wasm](https://github.com/cloudflare/images) for advanced processing in Workers

#### PATCH /admin/photos/:id

Update photo metadata (caption, sort order, visibility).

**Request body (all fields optional):**

```json
{
  "caption_en": "Updated caption",
  "caption_cs": "Aktualizovaný popisek",
  "sort_order": 5,
  "is_visible": false
}
```

**Response (200):**

```json
{
  "data": {
    "id": "bali-1710501000-abc123",
    "caption_en": "Updated caption",
    "sort_order": 5,
    "is_visible": 0,
    ...
  }
}
```

#### DELETE /admin/photos/:id

Delete photo from R2 storage and D1 database.

**Response (200):**

```json
{
  "message": "Photo deleted"
}
```

## Error Responses

### 400 Bad Request

Invalid input or validation errors.

```json
{
  "error": "Validation failed",
  "details": [
    "lat must be a number between -90 and 90",
    "continent must be one of: Africa, Asia, Europe, ..."
  ]
}
```

### 401 Unauthorized

Missing or invalid authentication.

```json
{
  "error": "Unauthorized",
  "message": "Valid authentication required. Provide API key or Cloudflare Access token."
}
```

### 404 Not Found

Resource not found.

```json
{
  "error": "Destination not found"
}
```

### 409 Conflict

Resource already exists.

```json
{
  "error": "Destination already exists with this ID"
}
```

### 500 Internal Server Error

Server error (includes details in development mode).

```json
{
  "error": "Internal server error",
  "message": "D1 query failed: ..." // development only
}
```

## Setup

### 1. Configure Environment Variables

In Cloudflare dashboard:

1. Go to Pages > your project > Settings > Environment variables
2. Add for **Production** and **Preview**:
   - `ADMIN_API_KEY`: Generate a strong random key (e.g., `openssl rand -base64 32`)
   - `CF_ACCESS_TEAM_DOMAIN`: (Optional) Your Cloudflare Access team name

### 2. (Optional) Set Up Cloudflare Access

For team-based authentication:

1. Go to Cloudflare dashboard > Zero Trust > Access > Applications
2. Create a new application for your domain
3. Add a policy (e.g., allow specific emails)
4. Set `CF_ACCESS_TEAM_DOMAIN` to your team domain

### 3. Test Locally

```bash
# Set env vars in .dev.vars (don't commit this file!)
echo 'ADMIN_API_KEY="test-key-123"' > .dev.vars

# Run dev server
npm run dev

# Test endpoint
curl -X POST http://localhost:8788/admin/destinations \
  -H "Authorization: Bearer test-key-123" \
  -H "Content-Type: application/json" \
  -d '{"id": "test", "name_en": "Test", ...}'
```

## Security Notes

- **Never commit API keys** to version control
- Use strong, randomly generated API keys (minimum 32 characters)
- Rotate API keys regularly
- Consider using Cloudflare Access for team-based authentication
- Enable HTTPS only in production (Cloudflare Pages does this by default)
- Monitor access logs for suspicious activity

## Future Improvements

- [ ] Implement proper JWT verification with Cloudflare Access public keys
- [ ] Add rate limiting to prevent abuse
- [ ] Integrate Cloudflare Images API for better image processing
- [ ] Add batch operations (bulk upload, bulk delete)
- [ ] Add audit logging for admin actions
- [ ] Support image optimization (WebP conversion, quality adjustment)
- [ ] Add photo reordering endpoint (drag & drop support)
