import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import { Asset } from '../../types/dagster';

interface VirtualizedAssetGridProps {
  assets: Asset[];
  itemHeight: number;
  itemWidth: number;
  containerWidth: number;
  containerHeight: number;
}

interface GridItemProps {
  columnIndex: number;
  rowIndex: number;
  style: React.CSSProperties;
  data: {
    assets: Asset[];
    columnsPerRow: number;
    ItemComponent: React.ComponentType<{ asset: Asset }>;
  };
}

const GridItem: React.FC<GridItemProps> = ({ columnIndex, rowIndex, style, data }) => {
  const { assets, columnsPerRow, ItemComponent } = data;
  const index = rowIndex * columnsPerRow + columnIndex;
  const asset = assets[index];

  if (!asset) {
    return <div style={style} />;
  }

  return (
    <div style={{ ...style, padding: '12px' }}>
      <ItemComponent asset={asset} />
    </div>
  );
};

export const VirtualizedAssetGrid: React.FC<VirtualizedAssetGridProps> = ({
  assets,
  itemHeight,
  itemWidth,
  containerWidth,
  containerHeight,
}) => {
  const columnsPerRow = Math.floor(containerWidth / itemWidth);
  const rowCount = Math.ceil(assets.length / columnsPerRow);

  const itemData = useMemo(() => ({
    assets,
    columnsPerRow,
    ItemComponent: React.lazy(() => 
      Promise.resolve({ 
        default: ({ asset }: { asset: Asset }) => {
          // This would be the AssetCard component content
          return <div>Asset: {asset.key.path.join('.')}</div>;
        }
      })
    ),
  }), [assets, columnsPerRow]);

  return (
    <Grid
      columnCount={columnsPerRow}
      columnWidth={itemWidth}
      height={containerHeight}
      rowCount={rowCount}
      rowHeight={itemHeight}
      width={containerWidth}
      itemData={itemData}
    >
      {GridItem}
    </Grid>
  );
};

export default VirtualizedAssetGrid;