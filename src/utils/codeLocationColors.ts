/**
 * Central utility for consistent code location coloring across the application.
 * Uses hash-based color assignment to ensure the same code location always gets the same color.
 */

// Color palette using CSS variables for consistency with the design system
const COLOR_PALETTE = [
//   'var(--color-accent-blue)',    // Primary blue
//   'var(--color-accent-success)', // Green for success
//   'var(--color-accent-warn)',    // Yellow/amber for warnings
//   'var(--color-accent-error)',   // Red for errors
  '#8b5cf6',  // Violet
  '#06b6d4',  // Cyan
  '#84cc16',  // Lime
  '#f97316',  // Orange
  '#ec4899',  // Pink
  '#6366f1',  // Indigo
  '#14b8a6',  // Teal
  '#a3a3a3'   // Gray
];

// Extended palette with opacity variants for charts that need fill and stroke
const CHART_COLOR_PALETTE = [
  { fill: 'rgba(79, 67, 221, 0.3)', stroke: '#4f43dd', solid: '#4f43dd' },    // Blue
  { fill: 'rgba(49, 218, 114, 0.3)', stroke: '#31da72', solid: '#31da72' },   // Success green
  { fill: 'rgba(238, 218, 41, 0.3)', stroke: '#eeda29', solid: '#eeda29' },   // Warning yellow
  { fill: 'rgba(225, 59, 50, 0.3)', stroke: '#e13b32', solid: '#e13b32' },    // Error red
  { fill: 'rgba(139, 92, 246, 0.3)', stroke: '#8b5cf6', solid: '#8b5cf6' },   // Violet
  { fill: 'rgba(6, 182, 212, 0.3)', stroke: '#06b6d4', solid: '#06b6d4' },    // Cyan
  { fill: 'rgba(132, 204, 22, 0.3)', stroke: '#84cc16', solid: '#84cc16' },   // Lime
  { fill: 'rgba(249, 115, 22, 0.3)', stroke: '#f97316', solid: '#f97316' },   // Orange
  { fill: 'rgba(236, 72, 153, 0.3)', stroke: '#ec4899', solid: '#ec4899' },   // Pink
  { fill: 'rgba(99, 102, 241, 0.3)', stroke: '#6366f1', solid: '#6366f1' },   // Indigo
  { fill: 'rgba(20, 184, 166, 0.3)', stroke: '#14b8a6', solid: '#14b8a6' },   // Teal
  { fill: 'rgba(163, 163, 163, 0.3)', stroke: '#a3a3a3', solid: '#a3a3a3' }   // Gray
];

/**
 * Simple hash function to convert a string to a number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a consistent color for a code location name
 * @param codeLocationName - The name of the code location
 * @returns A CSS color value (either CSS variable or hex)
 */
export function getCodeLocationColor(codeLocationName: string): string {
  if (!codeLocationName || codeLocationName.trim() === '') {
    return COLOR_PALETTE[COLOR_PALETTE.length - 1]; // Return gray for empty/invalid names
  }
  
  const normalizedName = codeLocationName.trim().toLowerCase();
  const hash = hashString(normalizedName);
  const colorIndex = hash % COLOR_PALETTE.length;
  
  return COLOR_PALETTE[colorIndex];
}

/**
 * Get a consistent chart color set (fill, stroke, solid) for a code location name
 * Useful for charts that need different opacity variants of the same color
 * @param codeLocationName - The name of the code location
 * @returns An object with fill, stroke, and solid color properties
 */
export function getCodeLocationChartColors(codeLocationName: string): {
  fill: string;
  stroke: string;
  solid: string;
} {
  if (!codeLocationName || codeLocationName.trim() === '') {
    return CHART_COLOR_PALETTE[CHART_COLOR_PALETTE.length - 1]; // Return gray for empty/invalid names
  }
  
  const normalizedName = codeLocationName.trim().toLowerCase();
  const hash = hashString(normalizedName);
  const colorIndex = hash % CHART_COLOR_PALETTE.length;
  
  return CHART_COLOR_PALETTE[colorIndex];
}

/**
 * Get a consistent color by index (for situations where you need colors by position)
 * @param index - The index in the color palette
 * @returns A CSS color value
 */
export function getColorByIndex(index: number): string {
  return COLOR_PALETTE[index % COLOR_PALETTE.length];
}

/**
 * Get a consistent chart color set by index
 * @param index - The index in the color palette
 * @returns An object with fill, stroke, and solid color properties
 */
export function getChartColorsByIndex(index: number): {
  fill: string;
  stroke: string;
  solid: string;
} {
  return CHART_COLOR_PALETTE[index % CHART_COLOR_PALETTE.length];
}

/**
 * Get all available colors (useful for generating legends)
 * @returns Array of all color values
 */
export function getAllColors(): string[] {
  return [...COLOR_PALETTE];
}

/**
 * Get all chart color sets (useful for generating chart legends)
 * @returns Array of all chart color objects
 */
export function getAllChartColors(): Array<{
  fill: string;
  stroke: string;
  solid: string;
}> {
  return [...CHART_COLOR_PALETTE];
}