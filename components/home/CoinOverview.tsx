import { fetcher } from "@/lib/coingecko.actions";
import { formatCurrency } from "@/lib/utils";
import Image from "next/image";
import { CoinOverviewFallback } from "@/components/home/fallback";

export const CoinOverview = async () => {
  let coin;

  try {
    coin = await fetcher<CoinDetailsData>("/coins/bitcoin", {
      dex_pair_format: "symbol",
    });
  } catch (error) {
    console.error("[CoinOverview] Failed to fetch coin overview", error);
    return <CoinOverviewFallback />;
  }

  return (
    <div id="coin-overview">
      <div className="header pt-2">
        <Image src={coin.image.large} alt={coin.name} width={56} height={56} />
        <div className="info">
          <p>
            {coin.name} / {coin.symbol.toUpperCase()}
          </p>
          <h1>
            {formatCurrency(coin.market_data.current_price.usd, {
              currency: "USD",
            })}
          </h1>
        </div>
      </div>
    </div>
  );
};
