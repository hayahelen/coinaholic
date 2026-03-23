import { fetcher } from "@/lib/coingecko.actions";
import { cn, formatCurrency, formatPercentage } from "@/lib/utils";
import Image from "next/image";
import React from "react";
import DataTable from "@/components/DataTable";
import Link from "next/link";
import CoinsPagination from "@/components/CoinsPagination";

const Coins = async ({ searchParams }: NextPageProps) => {
  const { page } = await searchParams;
  const rawPage = Array.isArray(page) ? page[0] : page;
  const parsedPage = Number.parseInt(rawPage ?? "1", 10);
  const currentPage =
    Number.isFinite(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  console.log("Current page:", page);
  // const currentPage = Number(page) || 1;
  const perPage = 10;
  let coinsData: CoinMarketData[];

  try {
    coinsData = await fetcher<CoinMarketData[]>("/coins/markets", {
      vs_currency: "usd",
      order: "market_cap_desc",
      per_page: perPage,
      page: currentPage,
      sparkline: false,
      price_change_percentage: "24h",
    });
  } catch (error) {
    console.error("[Coins] Failed to fetch coins", error);
    return <div>Failed to load coins</div>;
  }

  const columns: DataTableColumn<CoinMarketData>[] = [
    {
      header: "Rank",
      cellClassName: "rank-cell",
      cell: (coin) => (
        <>
          #{coin.market_cap_rank}
          <Link href={`/coins/${coin.id}`} aria-label="View coin" />
        </>
      ),
    },
    {
      header: "Token",
      cellClassName: "token-cell",
      cell: (coin) => (
        <div className="token-info flex flex-row items-center gap-2">
          <Image src={coin.image} alt={coin.name} width={28} height={28} />
          <div className="flex flex-row gap-1">
            <p>{coin.name}</p>
            <p>({coin.symbol.toUpperCase()})</p>
          </div>
        </div>
      ),
    },
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: (coin) => formatCurrency(coin.current_price),
    },
    {
      header: "24h Change",
      cellClassName: "change-cell",
      cell: (coin) => {
        const change = coin.price_change_percentage_24h;
        const isTrendingUp = change > 0;

        return (
          <span
            className={cn(
              "change-value",
              isTrendingUp ? "text-green-600" : "text-red-500",
            )}
          >
            {isTrendingUp && "+"}
            {formatPercentage(change)}
          </span>
        );
      },
    },
    {
      header: "Market Cap",
      cellClassName: "market-cap-cell",
      cell: (coin) => formatCurrency(coin.market_cap),
    },
  ];

  const hasMorePages = coinsData.length === perPage;
  const estimatedTotalPages =
    currentPage >= 100 ? Math.ceil(currentPage / 100) * 100 + 100 : 100;

  return (
    <main id="coins-page">
      <div className="content">
        <h4>All Coins</h4>

        <DataTable
          columns={columns}
          data={coinsData}
          rowKey={(coin) => coin.id}
          tableClassName="coins-table"
        />

        <CoinsPagination
          currentPage={currentPage}
          totalPages={estimatedTotalPages}
          hasMorePages={hasMorePages}
        />
      </div>
    </main>
  );
};

export default Coins;
