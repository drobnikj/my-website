# Admin UI Guide

This document explains how to use the admin interface for managing destinations and photos.

## 🔐 Access

The admin interface is available at `/admin` and is protected by:

1. **Cloudflare Access** (recommended for production)
2. **API Key** authentication

### Setup Authentication

#### Option 1: Cloudflare Access (Recommended)

1. Go to Cloudflare dashboard → Zero Trust → Access → Applications
2. Create a new application for your domain
3. Add a policy (e.g., allow specific emails)
4. Set `CF_ACCESS_TEAM_DOMAIN` in Environment Variables
5. Access `/admin` - you'll be redirected to Cloudflare login

#### Option 2: API Key

1. Generate a strong API key:
   ```bash
   openssl rand -base64 32
   ```

2. Set in Cloudflare Pages → Settings → Environment variables:
   - Variable name: `ADMIN_API_KEY`
   - Value: your generated key

3. For local development, create `.dev.vars`:
   ```
   ADMIN_API_KEY="your-key-here"
   ```

**Note:** The middleware will check for API key in `Authorization` header, but for browser access, Cloudflare Access is recommended.

## 📱 Features

### 1. Destinations Manager

Create, edit, and delete travel destinations.

**Fields:**
- **ID**: Unique identifier (lowercase, hyphens only, e.g., `iceland`)
- **Name (EN/CS)**: Destination name in both languages
- **Description (EN/CS)**: Full description in both languages
- **Continent**: One of: Africa, Asia, Europe, North America, South America, Oceania, Antarctica
- **Coordinates**: Latitude (-90 to 90) and Longitude (-180 to 180)
- **Year Visited**: Year you visited (1900-2100)
- **Date Range** (optional): Specific dates of visit

**Actions:**
- ➕ **Add Destination**: Click the button to show the form
- ✏️ **Edit**: Click the edit icon on any destination card
- 🗑️ **Delete**: Remove destination (WARNING: also deletes all photos)

### 2. Photos Manager

Upload and manage photos for each destination.

**Upload:**
- Select a destination from the dropdown
- Drag & drop images onto the upload area, OR
- Click the upload area to browse files
- Supports: JPG, PNG, WebP (max 10MB per file)

**Photo Management:**
- **Caption (EN/CS)**: Add captions in both languages
- **Visibility**: Show/hide photos on the public site
- **Sorting**: Use ⬆️⬇️ buttons to reorder photos
- **Edit**: Click ✏️ to edit captions and visibility
- **Delete**: Click 🗑️ to remove a photo

**Tips:**
- Photos are automatically processed (full size + thumbnail)
- Sort order determines display order on the travel map
- Hidden photos won't appear on the public site but remain in the database

## 📱 Mobile Usage

The admin interface is fully responsive and works on mobile devices:

- Touch-friendly buttons and controls
- Drag & drop works on mobile (use file picker as fallback)
- Optimized layout for small screens
- All features available on mobile

## 🚀 Workflow Example

### Adding a New Destination with Photos

1. **Create Destination:**
   - Go to Admin → Destinations
   - Click "Add Destination"
   - Fill in all required fields (ID, names, descriptions, coordinates, year, continent)
   - Click "Create"

2. **Upload Photos:**
   - Go to Admin → Photos
   - Select your new destination from dropdown
   - Drag & drop all photos at once
   - Photos upload one by one (you'll see progress)

3. **Organize Photos:**
   - Use ⬆️⬇️ to reorder (first photo = hero image)
   - Click ✏️ to add captions
   - Toggle visibility if needed
   - Click "Save" after editing

4. **Verify on Public Site:**
   - Go to `/travels` to see your new destination on the map
   - Click the marker to view photos in the modal

## 🔒 Security Notes

- The admin panel uses the same authentication as the API endpoints
- All requests require valid authentication (Cloudflare Access JWT or API key)
- Unauthorized access returns 401 errors
- Use HTTPS in production (Cloudflare Pages enforces this)
- Never commit API keys to version control
- Monitor access logs for suspicious activity

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check that `ADMIN_API_KEY` or `CF_ACCESS_TEAM_DOMAIN` is set correctly
- For Cloudflare Access: Make sure you're logged in and have permission
- Try logging out and back in

### Upload Fails
- Check file size (max 10MB)
- Verify destination exists and is selected
- Check browser console for detailed errors
- Ensure R2 bucket is properly bound in Cloudflare Pages settings

### Photos Don't Appear
- Check visibility toggle (hidden photos don't show on public site)
- Verify R2 binding is configured: Settings → Functions → R2 binding `PHOTOS`
- Check D1 binding: Settings → Functions → D1 binding `DB`

### Database Errors
- Run migrations: `npm run db:migrate:prod` (production) or `npm run db:migrate:local` (local)
- Check bindings in Cloudflare Pages dashboard

## 💡 Best Practices

1. **Destination IDs**: Use descriptive, URL-friendly IDs (e.g., `iceland-2024`, `patagonia`)
2. **Photo Order**: Put your best/hero photo first (sort_order = 0)
3. **Captions**: Add context to photos - location details, interesting facts
4. **Visibility**: Use hidden photos for drafts or seasonal content
5. **Backups**: Regularly export your D1 database and R2 bucket
6. **Testing**: Test on staging environment before production changes
7. **Mobile Testing**: Check the admin UI on actual mobile devices

## 📊 Data Model

### Destinations Table
```typescript
interface Destination {
  id: string;                 // Primary key
  name_en: string;
  name_cs: string;
  description_en: string;
  description_cs: string;
  lat: number;                // -90 to 90
  lng: number;                // -180 to 180
  continent: string;
  visited_at_year: number;    // 1900-2100
  visited_from?: string;      // ISO date
  visited_to?: string;        // ISO date
  created_at: string;
  updated_at: string;
}
```

### Photos Table
```typescript
interface Photo {
  id: string;                 // UUID
  destination_id: string;     // Foreign key
  full_url: string;           // R2 key
  thumb_url: string;          // R2 key
  blur_url: string | null;    // Data URL or R2 key
  caption_en: string | null;
  caption_cs: string | null;
  sort_order: number;         // Display order
  is_visible: 0 | 1;          // Boolean
  created_at: string;
}
```

## 🔗 Related Documentation

- [ADMIN_API.md](./ADMIN_API.md) - API endpoints reference
- [README.md](./README.md) - General project documentation
- [MIGRATION.md](./MIGRATION.md) - Database migration guide
