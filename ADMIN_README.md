# Admin UI - Photo & Destination Management

Admin interface for managing travel destinations and photos, protected by Cloudflare Access.

## 🎯 Features Implemented

### ✅ Authentication
- Mock login page with Cloudflare Access design
- Development token: `mock-admin-token`
- Auth state persisted in localStorage
- Protected routes (redirects to login if not authenticated)

### ✅ Destinations Management (CRUD)
- **List View**: Grid layout with destination cards
- **Create**: Modal form with all required fields
  - Name
  - Description
  - Latitude & Longitude
  - Continent (dropdown with emoji icons)
  - Visit Date (free-form text like "March 2024")
- **Edit**: Same form, pre-filled with existing data
- **Delete**: Confirmation dialog before deletion
- Empty state when no destinations exist

### ✅ Photos Management
- **Upload**: Drag & drop interface
  - Multi-file upload support
  - Image preview before upload
  - Optional captions for each photo
  - File validation (images only)
- **Organize**: Drag to reorder photos
- **Edit**: Toggle visibility (show/hide)
- **Delete**: Remove photos with confirmation
- Empty state when no destinations exist
- Filter by destination (dropdown)

### ✅ UI/UX
- **Responsive Design**: Works on mobile, tablet, desktop
  - Sidebar converts to top bar on mobile
  - Grid layouts adapt to screen size
  - Modal forms stack on small screens
- **Accessibility**: Proper labels, ARIA attributes, keyboard navigation
- **Loading States**: Spinners for async operations
- **Error Handling**: User-friendly error messages
- **Theme Support**: Respects light/dark theme from main site

## 🏗️ Architecture

### Mock API (`src/services/api.ts`)
All API calls currently use mocks with delays to simulate real backend:
- `createDestination()` - Creates new destination (mock)
- `updateDestination()` - Updates existing destination (mock)
- `deleteDestination()` - Deletes destination (mock)
- `uploadPhoto()` - Uploads photo with caption (mock)
- `updatePhoto()` - Updates photo metadata (mock)
- `deletePhoto()` - Deletes photo (mock)
- `reorderPhotos()` - Reorders photos for a destination (mock)

**Production Integration:**
When the Cloudflare Worker API is ready (tasks #3-#8), replace mock implementations with real API calls. The interfaces are already defined and ready.

### Components

```
src/
├── services/
│   └── api.ts                    # Mock API service (ready for real backend)
├── pages/
│   ├── AdminPage.tsx             # Main admin layout with auth & routing
│   └── AdminPage.css
├── components/
│   └── admin/
│       ├── AdminDestinations.tsx # Destinations CRUD
│       ├── AdminDestinations.css
│       ├── AdminPhotos.tsx       # Photos upload & management
│       └── AdminPhotos.css
└── App.tsx                       # Added /admin/* route
```

### Routes

- `/admin` - Dashboard (overview of admin sections)
- `/admin/destinations` - Manage destinations
- `/admin/photos` - Upload and manage photos

## 🚀 Development

### Local Testing

```bash
npm install
npm run dev
```

Open [http://localhost:5173/admin](http://localhost:5173/admin)

**Login with:** `mock-admin-token`

### Build

```bash
npm run build
```

### Production Deployment

When deploying with Cloudflare Access:

1. Configure Cloudflare Access policy for `/admin/*`
2. Update `src/services/api.ts`:
   - Remove mock implementations
   - Point API calls to Cloudflare Worker endpoints
   - Use Cloudflare Access JWT for authentication
3. Environment variables (if needed):
   - `VITE_API_BASE_URL` - Worker API URL
   - `VITE_CF_ACCESS_ENABLED` - Enable real CF Access

## 🔗 Backend Integration Checklist

When tasks #3-#8 are complete, replace mocks with real API calls:

- [ ] Update `api.checkAuth()` to validate CF Access JWT
- [ ] Update `api.login()` to use CF Access flow
- [ ] Point `getDestinations()` to `GET /api/v1/destinations`
- [ ] Point `createDestination()` to `POST /api/v1/admin/destinations`
- [ ] Point `updateDestination()` to `PATCH /api/v1/admin/destinations/:id`
- [ ] Point `deleteDestination()` to `DELETE /api/v1/admin/destinations/:id`
- [ ] Point `getPhotos()` to `GET /api/v1/photos?destinationId=xxx`
- [ ] Point `uploadPhoto()` to `POST /api/v1/admin/photos` (multipart/form-data → R2)
- [ ] Point `updatePhoto()` to `PATCH /api/v1/admin/photos/:id`
- [ ] Point `deletePhoto()` to `DELETE /api/v1/admin/photos/:id`
- [ ] Point `reorderPhotos()` to `POST /api/v1/admin/destinations/:id/photos/reorder`

## 📝 Notes

- **Mock data is ephemeral** - reloading the page resets all data
- **Auth persists** - localStorage keeps you logged in across reloads
- **TypeScript strict mode** - All types are properly defined
- **No external dependencies** added - uses existing React Router, etc.
- **CSS variables** - Uses existing theme colors from main site
- **Production-ready** - Code is clean, typed, and ready for backend integration

## 🎨 Design Decisions

- **Modal forms** instead of separate pages - better UX, less navigation
- **Drag & drop upload** - modern, intuitive file handling
- **Empty states** - guide users when data is missing
- **Inline editing** - quick actions without leaving the page
- **Confirmation dialogs** - prevent accidental deletions
- **Responsive first** - designed for mobile use in the field

## 🐛 Known Limitations (Mock Mode)

- Photos use `URL.createObjectURL()` - won't persist across reloads
- No actual file upload to R2 - just preview
- Destinations aren't persisted - mock data only
- No pagination - assumes small dataset
- No search/filter (except photos by destination)

These will all be resolved when the real backend is connected.
