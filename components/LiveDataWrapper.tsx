"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Separator } from "./ui/separator";
import CandlestickChart from "./CandlestickChart";
import { getOHLCVData, getTrades } from "@/lib/coingecko.actions";
import { formatCurrency, timeAgo } from "@/lib/utils";
import DataTable from "@/components/DataTable";
import CoinHeader from "./CoinHeader";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const REFRESH_INTERVAL = 65000; // 60s safe for demo API

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
  const ITEMS_PER_PAGE = 10;

  const [currentPage, setCurrentPage] = useState(1);

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
        if (!append) {
          setCurrentPage(1);
        }
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

  // const handleLoadMore = () => {
  //   setVisibleCount((prev) => prev + 10);
  // };

  const fetchOHLCV = useCallback(async () => {
    if (!network || !poolAddress) return;

    try {
      setLoading(true);
      setLiveOhlcv([]);

      const response = await getOHLCVData(
        coinId,
        network,
        poolAddress,
        liveInterval,
      );

      if (!response) return;

      const ohlcv = response.data?.attributes?.ohlcv_list ?? [];

      const baseCoinId = response.meta?.base?.coingecko_coin_id;
      const quoteCoinId = response.meta?.quote?.coingecko_coin_id;
      const shouldInvert = quoteCoinId === coinId && baseCoinId !== coinId;

      const formatted = ohlcv.map(([t, o, h, l, c, v]) => {
        if (!shouldInvert) {
          return [t, o, h, l, c, v] as OHLCVCandle;
        }

        return [t, 1 / o, 1 / l, 1 / h, 1 / c, v] as OHLCVCandle;
      });

      setLiveOhlcv(formatted.sort((a, b) => a[0] - b[0]));
    } catch (err) {
      console.error("Failed to fetch OHLCV:", err);
    } finally {
      setLoading(false);
    }
  }, [coinId, network, poolAddress, liveInterval]);

  const rawLivePrice = liveOhlcv?.length
    ? liveOhlcv[liveOhlcv.length - 1][4]
    : null;

  const livePrice =
    rawLivePrice &&
    rawLivePrice > coin.market_data.current_price.usd * 0.5 &&
    rawLivePrice < coin.market_data.current_price.usd * 1.5
      ? rawLivePrice
      : coin.market_data.current_price.usd;

  const totalPages = Math.ceil(trades.length / ITEMS_PER_PAGE);

  const paginatedTrades = trades.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  useEffect(() => {
    fetchTrades(false);
    fetchOHLCV();

    const interval = setInterval(() => {
      setLiveOhlcv([]);
      fetchTrades(false);
      fetchOHLCV();
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [fetchTrades, fetchOHLCV]);

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
            // data={trades.slice(0, visibleCount)}
            data={paginatedTrades}
            rowKey={(_, index) => index}
            tableClassName="trades-table"
          />

          {/* <button onClick={handleLoadMore} disabled={loading}>
            {loading ? "Loading..." : "Load More"}
          </button> */}
          {totalPages > 1 && (
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();

                      if (currentPage > 1) {
                        setCurrentPage((prev) => prev - 1);
                      }
                    }}
                    className={
                      currentPage === 1
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>

                {(() => {
                  const pages: (number | string)[] = [];

                  // always show first page
                  if (currentPage > 2) {
                    pages.push(1);
                  }

                  // show leading dots
                  if (currentPage > 3) {
                    pages.push("start-ellipsis");
                  }

                  // show current range (max 3 pages)
                  const start = Math.max(1, currentPage - 1);
                  const end = Math.min(totalPages, currentPage + 1);

                  for (let page = start; page <= end; page++) {
                    pages.push(page);
                  }

                  // show trailing dots
                  if (currentPage < totalPages - 2) {
                    pages.push("end-ellipsis");
                  }

                  // always show last page
                  if (currentPage < totalPages - 1) {
                    pages.push(totalPages);
                  }

                  return pages.map((item, index) => {
                    if (typeof item === "string") {
                      return (
                        <PaginationItem key={item + index}>
                          <span className="px-3 py-2 text-muted-foreground">
                            ...
                          </span>
                        </PaginationItem>
                      );
                    }

                    return (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={currentPage === item}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(item);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  });
                })()}

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();

                      if (currentPage < totalPages) {
                        setCurrentPage((prev) => prev + 1);
                      }
                    }}
                    className={
                      currentPage === totalPages
                        ? "pointer-events-none opacity-50"
                        : "cursor-pointer"
                    }
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      )}
    </section>
  );
};

export default LiveDataWrapper;
