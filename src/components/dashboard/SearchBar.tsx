import { KeyboardEvent } from "react";

type SearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void;
};

export function SearchBar({ value, onChange, onFocus, onBlur, onKeyDown }: SearchBarProps) {
  return (
    <div className="surface rounded-2xl border px-3 py-2 shadow-[0_8px_30px_rgba(3,10,24,0.35)]">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className="text-dim w-full bg-transparent px-1 text-sm outline-none placeholder:text-gray-500"
        placeholder="종목/코인/뉴스 검색 (예: 삼성전자, NVDA, BTC)"
      />
    </div>
  );
}
