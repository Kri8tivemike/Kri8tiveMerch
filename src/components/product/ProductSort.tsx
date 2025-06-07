import { ArrowDown01, ArrowDownAZ, ArrowUp01, ArrowUpAZ, Clock, RotateCcw } from 'lucide-react';
import { ProductSort } from '../../types/product';
import { useTheme } from '../../contexts/ThemeProvider';

const sortOptions: ProductSort[] = [
  { field: 'created_at', direction: 'desc' },
  { field: 'price', direction: 'asc' },
  { field: 'price', direction: 'desc' },
  { field: 'name', direction: 'asc' },
  { field: 'name', direction: 'desc' },
];

const getSortLabel = (sort: ProductSort): string => {
  switch (`${sort.field}_${sort.direction}`) {
    case 'created_at_desc':
      return 'Newest';
    case 'price_asc':
      return 'Price: Low to High';
    case 'price_desc':
      return 'Price: High to Low';
    case 'name_asc':
      return 'Name: A to Z';
    case 'name_desc':
      return 'Name: Z to A';
    default:
      return 'Sort';
  }
};

const getSortIcon = (sort: ProductSort) => {
  switch (`${sort.field}_${sort.direction}`) {
    case 'created_at_desc':
      return <Clock className="h-4 w-4" />;
    case 'price_asc':
      return <ArrowUp01 className="h-4 w-4" />;
    case 'price_desc':
      return <ArrowDown01 className="h-4 w-4" />;
    case 'name_asc':
      return <ArrowUpAZ className="h-4 w-4" />;
    case 'name_desc':
      return <ArrowDownAZ className="h-4 w-4" />;
    default:
      return <RotateCcw className="h-4 w-4" />;
  }
};

interface ProductSortProps {
  sort?: ProductSort;
  onSortChange: (sort: ProductSort) => void;
  className?: string;
}

export default function ProductSortComponent({ sort, onSortChange, className = '' }: ProductSortProps) {
  const { theme } = useTheme();
  
  const currentSort = sort || sortOptions[0];

  const handleSortClick = () => {
    const currentIndex = sortOptions.findIndex(
      (option) => option.field === currentSort.field && option.direction === currentSort.direction
    );
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    onSortChange(sortOptions[nextIndex]);
  };

  return (
    <button
      onClick={handleSortClick}
      className={`flex items-center px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm text-sm text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-orange ${className}`}
      aria-label={`Sort by ${getSortLabel(currentSort)}`}
    >
      <span className="mr-2">{getSortIcon(currentSort)}</span>
      <span>{getSortLabel(currentSort)}</span>
    </button>
  );
}
