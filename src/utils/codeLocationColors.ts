/**
 * Central utility for consistent code location coloring across the application.
 * Uses hash-based color assignment to ensure the same code location always gets the same color.
 */

// Expanded color palette with 24 visually distinct colors to minimize collisions
const COLOR_PALETTE = [
  // Primary vibrant colors
  '#8b5cf6',  // Violet
  '#06b6d4',  // Cyan
  '#84cc16',  // Lime green
  '#f97316',  // Orange
  '#ec4899',  // Pink
  '#6366f1',  // Indigo
  '#14b8a6',  // Teal
  '#ef4444',  // Red
  
  // Secondary bright colors
  '#10b981',  // Emerald
  '#f59e0b',  // Amber
  '#8b5cf6',  // Purple
  '#3b82f6',  // Blue
  '#f43f5e',  // Rose
  '#06b6d4',  // Sky
  '#84cc16',  // Lime
  '#f97316',  // Orange
  
  // Tertiary colors with good contrast
  '#7c3aed',  // Deep violet
  '#059669',  // Green
  '#dc2626',  // Deep red
  '#2563eb',  // Deep blue
  '#db2777',  // Deep pink
  '#0891b2',  // Deep cyan
  '#65a30d',  // Deep lime
  '#a3a3a3'   // Gray (fallback)
];

// Extended palette with 24 colors and opacity variants for charts
const CHART_COLOR_PALETTE = [
  // Primary vibrant colors
  { fill: 'rgba(139, 92, 246, 0.3)', stroke: '#8b5cf6', solid: '#8b5cf6' },   // Violet
  { fill: 'rgba(6, 182, 212, 0.3)', stroke: '#06b6d4', solid: '#06b6d4' },    // Cyan
  { fill: 'rgba(132, 204, 22, 0.3)', stroke: '#84cc16', solid: '#84cc16' },   // Lime green
  { fill: 'rgba(249, 115, 22, 0.3)', stroke: '#f97316', solid: '#f97316' },   // Orange
  { fill: 'rgba(236, 72, 153, 0.3)', stroke: '#ec4899', solid: '#ec4899' },   // Pink
  { fill: 'rgba(99, 102, 241, 0.3)', stroke: '#6366f1', solid: '#6366f1' },   // Indigo
  { fill: 'rgba(20, 184, 166, 0.3)', stroke: '#14b8a6', solid: '#14b8a6' },   // Teal
  { fill: 'rgba(239, 68, 68, 0.3)', stroke: '#ef4444', solid: '#ef4444' },    // Red
  
  // Secondary bright colors
  { fill: 'rgba(16, 185, 129, 0.3)', stroke: '#10b981', solid: '#10b981' },   // Emerald
  { fill: 'rgba(245, 158, 11, 0.3)', stroke: '#f59e0b', solid: '#f59e0b' },   // Amber
  { fill: 'rgba(147, 51, 234, 0.3)', stroke: '#9333ea', solid: '#9333ea' },   // Purple
  { fill: 'rgba(59, 130, 246, 0.3)', stroke: '#3b82f6', solid: '#3b82f6' },   // Blue
  { fill: 'rgba(244, 63, 94, 0.3)', stroke: '#f43f5e', solid: '#f43f5e' },    // Rose
  { fill: 'rgba(14, 165, 233, 0.3)', stroke: '#0ea5e9', solid: '#0ea5e9' },   // Sky
  { fill: 'rgba(163, 230, 53, 0.3)', stroke: '#a3e635', solid: '#a3e635' },   // Light lime
  { fill: 'rgba(251, 146, 60, 0.3)', stroke: '#fb923c', solid: '#fb923c' },   // Light orange
  
  // Tertiary colors with good contrast
  { fill: 'rgba(124, 58, 237, 0.3)', stroke: '#7c3aed', solid: '#7c3aed' },   // Deep violet
  { fill: 'rgba(5, 150, 105, 0.3)', stroke: '#059669', solid: '#059669' },    // Green
  { fill: 'rgba(220, 38, 38, 0.3)', stroke: '#dc2626', solid: '#dc2626' },    // Deep red
  { fill: 'rgba(37, 99, 235, 0.3)', stroke: '#2563eb', solid: '#2563eb' },    // Deep blue
  { fill: 'rgba(219, 39, 119, 0.3)', stroke: '#db2777', solid: '#db2777' },   // Deep pink
  { fill: 'rgba(8, 145, 178, 0.3)', stroke: '#0891b2', solid: '#0891b2' },    // Deep cyan
  { fill: 'rgba(101, 163, 13, 0.3)', stroke: '#65a30d', solid: '#65a30d' },   // Deep lime
  { fill: 'rgba(163, 163, 163, 0.3)', stroke: '#a3a3a3', solid: '#a3a3a3' }   // Gray (fallback)
];

/**
 * Enhanced hash function to convert a string to a number with better distribution
 */
function hashString(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Apply additional mixing for better distribution across the larger palette
  hash = Math.abs(hash);
  hash = hash ^ (hash >>> 16);
  hash = hash * 0x85ebca6b;
  hash = hash ^ (hash >>> 13);
  hash = hash * 0xc2b2ae35;
  hash = hash ^ (hash >>> 16);
  
  return Math.abs(hash);
}

/**
 * Get a better distributed color index using multiple hash strategies
 */
function getColorIndex(str: string, paletteSize: number): number {
  const normalizedName = str.trim().toLowerCase();
  
  // Use multiple hash strategies and combine them for better distribution
  const hash1 = hashString(normalizedName);
  const hash2 = hashString(normalizedName.split('').reverse().join(''));
  const combinedHash = hash1 ^ hash2;
  
  return combinedHash % paletteSize;
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
  
  const colorIndex = getColorIndex(codeLocationName, COLOR_PALETTE.length);
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
  
  const colorIndex = getColorIndex(codeLocationName, CHART_COLOR_PALETTE.length);
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

/**
 * Debug utility to preview color assignments for a list of code location names
 * @param codeLocationNames - Array of code location names to preview
 * @returns Array of objects with name and assigned color
 */
export function previewColorAssignments(codeLocationNames: string[]): Array<{
  name: string;
  color: string;
  index: number;
}> {
  return codeLocationNames.map(name => ({
    name,
    color: getCodeLocationColor(name),
    index: getColorIndex(name, COLOR_PALETTE.length)
  }));
}

/**
 * Get the total number of available colors in the palette
 * @returns The number of unique colors available
 */
export function getColorPaletteSize(): number {
  return COLOR_PALETTE.length;
}