import { test, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test.describe('Signal Race Condition - Slider Test', () => {
  test('should not throw error when moving slider rapidly', async ({ page }) => {
    // Navigate to the test page
    const testPagePath = join(__dirname, 'slider-test.html');
    await page.goto(`file://${testPagePath}`);

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Listen for console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Listen for page errors
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Get the slider element
    const slider = page.locator('#slider');

    // Move slider rapidly to trigger race condition
    // This simulates the user moving the slider quickly
    for (let value = 1000; value <= 5000; value += 500) {
      await slider.fill(value.toString());
      // Small delay to allow effect to process
      await page.waitForTimeout(10);
    }

    // Move backwards
    for (let value = 5000; value >= 100; value -= 500) {
      await slider.fill(value.toString());
      await page.waitForTimeout(10);
    }

    // Check status element
    const status = await page.locator('#status').textContent();
    console.log('Final status:', status);

    // Check for errors
    if (errors.length > 0) {
      console.error('Errors encountered:', errors);
    }

    // Verify no "is not a function" errors occurred
    const hasRaceConditionError = errors.some(err =>
      err.includes('is not a function') || err.includes('I[j]')
    );

    expect(hasRaceConditionError).toBe(false);
    expect(errors.length).toBe(0);

    // Verify status shows success
    expect(status).toContain('No errors');
  });

  test('should correctly update items count', async ({ page }) => {
    const testPagePath = join(__dirname, 'slider-test.html');
    await page.goto(`file://${testPagePath}`);

    await page.waitForLoadState('networkidle');

    // Initial state
    const initialCount = await page.locator('#items-count').textContent();
    expect(initialCount).toBe('1000');

    // Move slider to 2000
    await page.locator('#slider').fill('2000');
    await page.waitForTimeout(50);

    const newCount = await page.locator('#items-count').textContent();
    expect(newCount).toBe('2000');

    // Move slider to 500
    await page.locator('#slider').fill('500');
    await page.waitForTimeout(50);

    const finalCount = await page.locator('#items-count').textContent();
    expect(finalCount).toBe('500');
  });
});
