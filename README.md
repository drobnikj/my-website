# My Website

Personal travel photography website with dynamic photo management powered by Cloudflare Workers, D1 database, and R2 storage.

## Architecture

- **Frontend:** React + TypeScript + Vite
- **Backend:** Cloudflare Workers (TypeScript)
- **Database:** Cloudflare D1 (SQLite)
- **Storage:** Cloudflare R2 (object storage for photos)
- **Deployment:** Vercel (frontend), Cloudflare Workers (API)

## Local Development

### Prerequisites

- Node.js 18+ and npm
- Cloudflare account (for production deployment)

### Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Initialize local D1 database:**

   ```bash
   npm run db:migrate:local
   ```

   This creates the local SQLite database with the `destinations` and `photos` tables.

3. **Seed the database with test data:**

   ```bash
   # ⚠️  WARNING: This will delete all existing data in the database
   npm run db:seed:local
   ```

   This populates the database with data from `src/data/travels.ts`.

4. **Run the development servers:**

   ```bash
   npm run dev
   ```

   This starts **both**:
   - Frontend (Vite) on `http://localhost:5173`
   - Backend (Cloudflare Worker) on `http://localhost:8787`

   The frontend automatically proxies `/api/*` requests to the Worker.

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start frontend + backend (parallel) |
| `npm run dev:frontend` | Start only Vite dev server |
| `npm run dev:worker` | Start only Cloudflare Worker (local mode) |
| `npm run build` | Build frontend for production |
| `npm run build:worker` | Deploy Worker to Cloudflare |
| `npm run db:migrate:local` | Run D1 migrations locally |
| `npm run db:migrate:prod` | Run D1 migrations in production |
| `npm run db:seed:local` | Seed local database with test data |
| `npm run lint` | Run ESLint |

## Database Schema

### `destinations` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key (e.g., "iceland") |
| `name_en` | TEXT | Destination name (English) |
| `name_cs` | TEXT | Destination name (Czech) |
| `description_en` | TEXT | Description (English) |
| `description_cs` | TEXT | Description (Czech) |
| `lat` | REAL | Latitude |
| `lng` | REAL | Longitude |
| `continent` | TEXT | Continent name |
| `year` | INTEGER | Year visited |
| `created_at` | DATETIME | Created timestamp |
| `updated_at` | DATETIME | Updated timestamp |

### `photos` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | TEXT | Primary key |
| `destination_id` | TEXT | Foreign key to `destinations.id` |
| `full_url` | TEXT | Full-size image URL |
| `thumb_url` | TEXT | Thumbnail image URL |
| `blur_url` | TEXT | Blur placeholder URL (optional) |
| `caption_en` | TEXT | Caption (English, optional) |
| `caption_cs` | TEXT | Caption (Czech, optional) |
| `sort_order` | INTEGER | Display order |
| `is_visible` | INTEGER | Visibility flag (1 = visible, 0 = hidden) |
| `created_at` | DATETIME | Created timestamp |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/destinations` | List all destinations (ordered by year) |
| `GET` | `/api/destinations/:id` | Get destination with photos |

### Example Response: GET `/api/destinations`

```json
{
  "data": [
    {
      "id": "colombia",
      "name_en": "Colombia",
      "name_cs": "Kolumbie",
      "description_en": "Caribbean coastline, colonial Cartagena...",
      "lat": 8.73,
      "lng": -74.55,
      "continent": "South America",
      "year": 2024
    }
  ]
}
```

### Example Response: GET `/api/destinations/colombia`

```json
{
  "data": {
    "id": "colombia",
    "name_en": "Colombia",
    "photos": [
      {
        "id": "colombia-DJI_0659",
        "full_url": "/travel-map/DJI_0659.webp",
        "thumb_url": "/travel-map/DJI_0659-thumb.webp",
        "blur_url": null,
        "sort_order": 0,
        "is_visible": 1
      }
    ]
  }
}
```

## Production Deployment

### Frontend (Vercel)

The frontend is automatically deployed to Vercel on push to `main`.

### Backend (Cloudflare Workers)

**⚠️  Important:** The production bindings in `wrangler.toml` are commented out by default to prevent failed deployments. Before deploying to production, you must set up the Cloudflare resources:

1. **Create D1 database:**

   ```bash
   wrangler d1 create my-website-db
   ```

   This will output a `database_id`. Save it.

2. **Create R2 bucket:**

   ```bash
   wrangler r2 bucket create my-website-photos
   ```

3. **Update `wrangler.toml`:**

   Uncomment the production bindings and replace `REPLACE_WITH_ACTUAL_DATABASE_ID` with your actual database ID from step 1.

4. **Run migrations:**

   ```bash
   npm run db:migrate:prod
   ```

5. **Upload photos to R2:**

   Upload your photo files to the R2 bucket (full, thumb, and blur versions).

6. **Deploy Worker:**

   ```bash
   npm run build:worker
   ```

**GitHub Auto-Deploy:** If you have Cloudflare Pages/Workers GitHub integration enabled, it will auto-deploy on push. Make sure you've completed the setup above first, or disable auto-deploy in the Cloudflare dashboard until ready.

## Project Structure

```
.
├── migrations/           # D1 database migrations
│   └── 0001_initial_schema.sql
├── public/               # Static assets
│   └── travel-map/       # Photo files
├── scripts/              # Build & utility scripts
│   └── seed-local-db.ts  # Local DB seeding
├── src/                  # Frontend source code
│   ├── components/       # React components
│   ├── data/             # Static data (travels.ts)
│   └── main.tsx          # React entry point
├── worker/               # Cloudflare Worker code
│   └── index.ts          # Worker entry point
├── wrangler.toml         # Cloudflare Worker config
├── vite.config.ts        # Vite config (with API proxy)
└── package.json          # Dependencies & scripts
```

## License

Private project.
