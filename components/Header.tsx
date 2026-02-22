import Link from "next/link";
import SearchBar from "./SearchBar";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">₿</span>
            </div>
            <span className="text-white font-bold text-lg hidden sm:block">
              CryptoDash
            </span>
          </Link>
          <div className="flex-1 max-w-md">
            <SearchBar onSearch={onSearch} placeholder="Search cryptocurrencies..." />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-gray-400 hidden md:block">
              Powered by CoinGecko
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
