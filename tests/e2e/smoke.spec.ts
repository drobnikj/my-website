import { test, expect } from '@playwright/test';

test.describe('Homepage Smoke Tests', () => {
  test('loads homepage successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/My Travel/i);
  });

  test('displays travel map', async ({ page }) => {
    await page.goto('/');
    
    // Wait for Leaflet map container
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('displays destination markers', async ({ page }) => {
    await page.goto('/');
    
    // Wait for markers to load
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 5000 });
    
    const markers = page.locator('.leaflet-marker-icon');
    const count = await markers.count();
    
    // Should have at least one marker
    expect(count).toBeGreaterThan(0);
  });

  test('can filter by year', async ({ page }) => {
    await page.goto('/');
    
    // Wait for year filter buttons
    const yearButtons = page.locator('[role="button"]').filter({ hasText: /20\d{2}/ });
    await expect(yearButtons.first()).toBeVisible({ timeout: 5000 });
    
    // Click a year filter
    await yearButtons.first().click();
    
    // Map should still be visible
    await expect(page.locator('.leaflet-container')).toBeVisible();
  });

  test('can open destination detail', async ({ page }) => {
    await page.goto('/');
    
    // Wait for a marker and click it
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 5000 });
    await page.locator('.leaflet-marker-icon').first().click();
    
    // Should open a popup or detail view
    await page.waitForTimeout(500); // Wait for animation
    
    // Check if popup or modal appeared (adjust selector based on your UI)
    const hasPopup = await page.locator('.leaflet-popup').isVisible().catch(() => false);
    const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    
    expect(hasPopup || hasModal).toBeTruthy();
  });
});

test.describe('Photo Gallery Smoke Tests', () => {
  test('loads photos from API', async ({ page }) => {
    // Navigate to a specific destination (adjust URL based on your routing)
    await page.goto('/');
    
    // Wait for initial load
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 5000 });
    
    // Click first marker
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForTimeout(1000);
    
    // Check if images are loaded (adjust selector to match your photo gallery)
    const images = page.locator('img[src*="travel-map"], img[src*="photo"], img[src*="image"]');
    const imageCount = await images.count();
    
    if (imageCount > 0) {
      // If photos exist, verify they load
      await expect(images.first()).toBeVisible({ timeout: 5000 });
      
      // Check that image src is not broken
      const src = await images.first().getAttribute('src');
      expect(src).toBeTruthy();
      expect(src?.length).toBeGreaterThan(0);
    }
  });

  test('displays thumbnails correctly', async ({ page }) => {
    await page.goto('/');
    
    // Wait for map
    await page.waitForSelector('.leaflet-marker-icon', { timeout: 5000 });
    
    // Click marker to open gallery
    await page.locator('.leaflet-marker-icon').first().click();
    await page.waitForTimeout(1000);
    
    // Find thumbnail images
    const thumbnails = page.locator('img[src*="thumb"]');
    const count = await thumbnails.count();
    
    if (count > 0) {
      await expect(thumbnails.first()).toBeVisible();
    }
  });
});

test.describe('Responsive Design Smoke Tests', () => {
  test('works on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Map should still be visible
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });

  test('works on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    const mapContainer = page.locator('.leaflet-container');
    await expect(mapContainer).toBeVisible();
  });
});

test.describe('API Integration Smoke Tests', () => {
  test('fetches destinations from API', async ({ page }) => {
    // Listen for API calls
    const apiCalls: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        apiCalls.push(request.url());
      }
    });
    
    await page.goto('/');
    await page.waitForTimeout(2000);
    
    // Should have called destinations API
    const hasDestinationsCall = apiCalls.some((url) => url.includes('/api/destinations'));
    expect(hasDestinationsCall).toBeTruthy();
  });

  test('handles API errors gracefully', async ({ page }) => {
    // Intercept API and return error
    await page.route('**/api/destinations', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal server error' }),
      });
    });
    
    await page.goto('/');
    
    // Page should still load without crashing
    await expect(page).toHaveTitle(/My Travel/i);
    
    // Should show some error state or empty state (adjust based on your error handling)
    await page.waitForTimeout(1000);
    // Just verify page doesn't crash
  });
});
