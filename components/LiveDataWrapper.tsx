"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Separator } from "./ui/separator";
import CandlestickChart from "./CandlestickChart";
import { getOHLCVData, getTrades } from "@/lib/coingecko.actions";
import { formatCurrency, timeAgo } from "@/lib/utils";
import DataTable from "@/components/DataTable";
import CoinHeader from "./CoinHeader";

const REFRESH_INTERVAL = 60000; // 60s safe for demo API

const LiveDataWrapper = ({
  coinId,
  poolAddress,
  network,
  coin,
  coinOHLCData,
}: LiveDataProps) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(false);
  const [visibleCount, setVisibleCount] = useState(10);
  const [liveInterval, setLiveInterval] = useState<"1m" | "1H" | "1D">("1m");
  const [price, setPrice] = useState<ExtendedPriceData | null>(null);
  const [liveOhlcv, setLiveOhlcv] = useState<OHLCVCandle[]>([]);

  const normalizeTrades = (res: any[]): Trade[] => {
    return res.map((t) => ({
      price: Number(t.attributes.price_to_in_usd),
      amount: Number(t.attributes.to_token_amount),
      value: Number(t.attributes.volume_in_usd),
      type: t.attributes.kind === "buy" ? "b" : "s",
      timestamp: t.attributes.block_timestamp,
    }));
  };

  const fetchTrades = useCallback(
    async (append = false) => {
      if (!network || !poolAddress) return;

      try {
        setLoading(true);

        const res = await getTrades(coinId, network, poolAddress);

        const normalized = normalizeTrades(res);

        setTrades((prev) => {
          const merged = append ? [...prev, ...normalized] : normalized;

          const unique = Array.from(
            new Map(
              merged.map((t) => [`${t.timestamp}-${t.price}`, t]),
            ).values(),
          );

          return unique;
        });
      } catch (err) {
        console.error("Failed to fetch trades:", err);
      } finally {
        setLoading(false);
      }
    },
    [coinId, network, poolAddress],
  );

  // get trades by using the two above (this is for 60 seconds because i am not subscribed)

  const tradeColumns: DataTableColumn<Trade>[] = [
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: (trade) => (trade.price ? formatCurrency(trade.price) : "-"),
    },
    {
      header: "Amount",
      cellClassName: "amount-cell",
      cell: (trade) => trade.amount?.toFixed(4) ?? "-",
    },
    {
      header: "Value",
      cellClassName: "value-cell",
      cell: (trade) => (trade.value ? formatCurrency(trade.value) : "-"),
    },
    {
      header: "Buy/Sell",
      cellClassName: "type-cell",
      cell: (trade) => (
        <span
          className={trade.type === "b" ? "text-green-500" : "text-red-500"}
        >
          {trade.type === "b" ? "Buy" : "Sell"}
        </span>
      ),
    },
    {
      header: "Time",
      cellClassName: "time-cell",
      cell: (trade) => (trade.timestamp ? timeAgo(trade.timestamp) : "-"),
    },
  ];

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + 10);
  };

  const fetchOHLCV = useCallback(async () => {
    if (!network || !poolAddress) return;

    try {
      setLoading(true);

      const res = await getOHLCVData(
        coinId,
        network,
        poolAddress,
        liveInterval,
      );

      const formatted = res.map(
        ([t, o, h, l, c, v]) => [t, o, h, l, c, v] as OHLCVCandle,
      );

      setLiveOhlcv(formatted.sort((a, b) => a[0] - b[0]));
    } catch (err) {
      console.error("Failed to fetch OHLCV:", err);
    } finally {
      setLoading(false);
    }
  }, [coinId, network, poolAddress, liveInterval]);

  useEffect(() => {
    fetchTrades(false);
    fetchOHLCV();

    const interval = setInterval(() => {
      fetchTrades(false);
      fetchOHLCV();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTrades, fetchOHLCV]);

  const rawLivePrice = liveOhlcv?.length
    ? liveOhlcv[liveOhlcv.length - 1][4]
    : null;

  const livePrice =
    rawLivePrice &&
    rawLivePrice > coin.market_data.current_price.usd * 0.5 &&
    rawLivePrice < coin.market_data.current_price.usd * 1.5
      ? rawLivePrice
      : coin.market_data.current_price.usd;

  return (
    <section id="live-data-wrapper">
      <CoinHeader
        name={coin.name}
        image={coin.image.large}
        livePrice={livePrice}
        livePriceChangePercentage24h={
          price?.change24h ?? coin.market_data.price_change_24h_in_currency.usd
        }
        priceChangePercentage30d={
          coin.market_data.price_change_percentage_30d_in_currency.usd
        }
        priceChange24h={coin.market_data.price_change_24h_in_currency.usd}
      />
      <Separator className="divider" />
      <div className="trend">
        <CandlestickChart
          coinId={coinId}
          data={coinOHLCData}
          liveOhlcv={liveOhlcv}
          mode="live"
          initialPeriod="daily"
          liveInterval={liveInterval}
          setLiveInterval={setLiveInterval}
        >
          <h4>Trend Overview</h4>
        </CandlestickChart>
      </div>

      <Separator className="divider" />

      {tradeColumns && (
        <div className="trades">
          <h4>Recent Trades</h4>

          <DataTable
            columns={tradeColumns}
            data={trades.slice(0, visibleCount)}
            rowKey={(_, index) => index}
            tableClassName="trades-table"
          />

          <button onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </section>
  );
};

export default LiveDataWrapper;
