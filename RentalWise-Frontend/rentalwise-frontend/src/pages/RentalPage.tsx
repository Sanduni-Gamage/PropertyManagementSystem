// src/pages/RentalPage.tsx
import SearchPageLayout from './Layouts/SearchPageLayout';
import RentalPropertyList from './RentalPropertyList';

export default function RentalPage() {
  return (
    <SearchPageLayout>
      <RentalPropertyList />
    </SearchPageLayout>
  );
}
