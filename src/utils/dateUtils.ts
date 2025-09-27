export function getDateRangeDays(dateRange: string): number {
  switch (dateRange) {
    case '1d': return 1;
    case '3d': return 3;
    case '7d': return 7;
    case '30d': return 30;
    default: return 7;
  }
}

export function isWithinDateRange(timestamp: string | number, dateRange: string): boolean {
  const days = getDateRangeDays(dateRange);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  const eventDate = new Date(typeof timestamp === 'string' ? parseFloat(timestamp) : timestamp);
  return eventDate >= cutoffDate;
}

export function filterAssetsByDateRange(assets: any[], dateRange: string): any[] {
  return assets.filter(asset => {
    // Check if any materialization is within the date range
    const hasRecentMaterialization = asset.assetMaterializations?.some((mat: any) => 
      isWithinDateRange(mat.timestamp, dateRange)
    );
    
    // Check if any observation is within the date range
    const hasRecentObservation = asset.assetObservations?.some((obs: any) => 
      isWithinDateRange(obs.timestamp, dateRange)
    );
    
    // Include asset if it has recent activity or if it has no activity at all (so we can see missing assets)
    return hasRecentMaterialization || hasRecentObservation || 
           (!asset.assetMaterializations?.length && !asset.assetObservations?.length);
  });
}