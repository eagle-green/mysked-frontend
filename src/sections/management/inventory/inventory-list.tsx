import type { BoxProps } from '@mui/material/Box';
import type { IInventoryItem } from 'src/types/inventory';

import Box from '@mui/material/Box';
import Pagination, { paginationClasses } from '@mui/material/Pagination';

import { InventoryItem } from './inventory-item';
import { InventoryItemSkeleton } from './inventory-skeleton';

// ----------------------------------------------------------------------

type Props = BoxProps & {
  loading?: boolean;
  items: IInventoryItem[];
  onItemClick?: (item: IInventoryItem) => void;
  getDetailsHref: (id: string) => string;
  page?: number;
  totalPages?: number;
  totalItems?: number;
  onPageChange?: (event: React.ChangeEvent<unknown>, page: number) => void;
};

export function InventoryList({
  items,
  loading,
  sx,
  onItemClick,
  getDetailsHref,
  page = 1,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  ...other
}: Props) {
  const renderLoading = () => <InventoryItemSkeleton />;

  const renderList = () =>
    items.map((item) => (
      <InventoryItem key={item.id} item={item} detailsHref={getDetailsHref(item.id)} />
    ));

  const showPagination = totalPages > 1 && onPageChange;

  return (
    <>
      <Box
        sx={[
          {
            gap: 3,
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(1, 1fr)',
              sm: 'repeat(2, 1fr)',
              md: 'repeat(3, 1fr)',
              lg: 'repeat(4, 1fr)',
            },
          },
          ...(Array.isArray(sx) ? sx : [sx]),
        ]}
        {...other}
      >
        {loading ? renderLoading() : renderList()}
      </Box>

      {showPagination && (
        <Pagination
          page={page}
          count={totalPages}
          onChange={onPageChange}
          sx={{
            mt: { xs: 5, md: 8 },
            [`& .${paginationClasses.ul}`]: { justifyContent: 'center' },
          }}
        />
      )}
    </>
  );
}

