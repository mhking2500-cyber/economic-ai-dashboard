type PriceCardProps = {
  name: string;
  symbol: string;
  price: string;
  change: string;
  direction: "up" | "down";
  flash?: "up" | "down" | null;
  watched?: boolean;
  onToggleWatch?: (e: React.MouseEvent) => void;
};

export function PriceCard({
  name,
  symbol,
  price,
  change,
  direction,
  flash = null,
  watched = false,
  onToggleWatch
}: PriceCardProps) {
  const directionColor = direction === "up" ? "text-up" : "text-down";
  const flashClass = flash ? (flash === "up" ? "price-flash-up" : "price-flash-down") : "";

  return (
    <div
      className={`surface relative rounded-2xl border p-4 shadow-[0_8px_30px_rgba(3,10,24,0.35)] backdrop-blur transition ${flashClass}`}
    >
      <div className="flex items-start justify-between">
        <p className="text-dim text-[11px] uppercase tracking-wide">{symbol}</p>
        {onToggleWatch && (
          <button
            onClick={onToggleWatch}
            className="text-lg leading-none transition hover:scale-110"
            aria-label={watched ? "관심종목 해제" : "관심종목 추가"}
          >
            {watched ? "★" : "☆"}
          </button>
        )}
      </div>
      <h3 className="mt-1 text-sm font-semibold">{name}</h3>
      <p className="mt-3 font-mono text-xl font-semibold">{price}</p>
      <p className={`mt-1 text-sm ${directionColor}`}>{change}</p>
    </div>
  );
}
