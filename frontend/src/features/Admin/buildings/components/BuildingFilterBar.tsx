import SearchInput from "../../../../components/ui/SearchInput";

interface BuildingFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  onResetPage: () => void;
}

export default function BuildingFilterBar({
  search,
  onSearchChange,
  onResetPage,
}: BuildingFilterBarProps) {
  const handleSearch = (value: string) => {
    onSearchChange(value);
    onResetPage();
  };

  return (
    <div className="flex items-center gap-3 w-full sm:w-auto">
      <SearchInput
        value={search}
        onChange={handleSearch}
        placeholder="Tìm kiếm theo tên chi nhánh, địa chỉ..."
        className="w-full sm:w-80 flex-1 min-w-0"
      />
    </div>
  );
}
