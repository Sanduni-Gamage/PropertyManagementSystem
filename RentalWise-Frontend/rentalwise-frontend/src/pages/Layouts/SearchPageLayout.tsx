
import type{ ReactNode } from 'react';
import SearchFilters from '../../components/SearchFilters';

interface Props {
  children: ReactNode;
}

export default function SearchPageLayout({ children }: Props) {
  return (
    <>
      <SearchFilters />
      <div className="px-4 sm:px-8">{children}</div>
    </>
  );
}
