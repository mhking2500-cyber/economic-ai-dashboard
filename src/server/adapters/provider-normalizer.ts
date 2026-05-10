export function normalizeSymbol(input: string): string {
  return input.trim().toUpperCase();
}

export function classifySymbolType(symbol: string): "stock" | "crypto" | "fx" {
  if (symbol.includes("KRW") || symbol.includes("USD")) {
    return "fx";
  }
  if (symbol.endsWith("USDT") || symbol === "BTC" || symbol === "ETH") {
    return "crypto";
  }
  return "stock";
}
