import React from "react";
import DataTable from "@/components/DataTable";

export const CoinOverviewFallback = () => {
  return (
    <div id="coin-overview-fallback">
      <div className="header pt-2">
        <div className="header-image skeleton" />
        <div className="info">
          <div className="header-line-sm skeleton" />
          <div className="header-line-lg skeleton" />
        </div>
      </div>

      <div className="flex gap-2 px-2 pb-3">
        <div className="period-button-skeleton skeleton" />
        <div className="period-button-skeleton skeleton" />
        <div className="period-button-skeleton skeleton" />
        <div className="period-button-skeleton skeleton" />
        <div className="period-button-skeleton skeleton" />
      </div>

      <div className="chart px-2 pb-2">
        <div className="chart-skeleton skeleton" />
      </div>
    </div>
  );
};

type TrendingFallbackRow = { id: string };

export const TrendingCoinsFallback = () => {
  const data: TrendingFallbackRow[] = Array.from({ length: 6 }, (_, i) => ({
    id: `fallback-${i}`,
  }));

  const columns: DataTableColumn<TrendingFallbackRow>[] = [
    {
      header: "Name",
      cellClassName: "name-cell",
      cell: () => (
        <div className="name-link">
          <div className="name-image skeleton" />
          <div className="name-line skeleton" />
        </div>
      ),
    },
    {
      header: "24h Change",
      cellClassName: "change-cell",
      cell: () => (
        <div className="price-change">
          <div className="change-icon skeleton" />
          <div className="change-line skeleton" />
        </div>
      ),
    },
    {
      header: "Price",
      cellClassName: "price-cell",
      cell: () => <div className="price-line skeleton" />,
    },
  ];

  return (
    <div id="trending-coins-fallback">
      <h4>Trending Coins</h4>
      <DataTable
        data={data}
        columns={columns}
        rowKey={(row) => row.id}
        tableClassName="trending-coins-table"
        headerCellClassName="py-3!"
        bodyCellClassName="py-2!"
      />
    </div>
  );
};

type CategoriesFallbackRow = { id: string };

export const CategoriesFallback = () => {
  const data: CategoriesFallbackRow[] = Array.from({ length: 10 }, (_, i) => ({
    id: `fallback-${i}`,
  }));

  const columns: DataTableColumn<CategoriesFallbackRow>[] = [
    {
      header: "Category",
      cellClassName: "category-cell",
      cell: () => <div className="category-skeleton skeleton" />,
    },
    {
      header: "Top Gainers",
      cellClassName: "top-gainers-cell",
      cell: () => (
        <div className="top-gainers-cell">
          <div className="coin-skeleton skeleton" />
          <div className="coin-skeleton skeleton" />
          <div className="coin-skeleton skeleton" />
        </div>
      ),
    },
    {
      header: "24h Change",
      cellClassName: "change-header-cell",
      cell: () => (
        <div className="change-cell">
          <div className="value-skeleton-sm skeleton" />
          <div className="change-icon skeleton" />
        </div>
      ),
    },
    {
      header: "Market Cap",
      cellClassName: "market-cap-cell",
      cell: () => <div className="value-skeleton-lg skeleton" />,
    },
    {
      header: "24h Volume",
      cellClassName: "volume-cell",
      cell: () => <div className="value-skeleton-md skeleton" />,
    },
  ];

  return (
    <div id="categories-fallback" className="custom-scrollbar">
      <h4>Top Categories</h4>
      <DataTable
        columns={columns}
        data={data}
        rowKey={(row) => row.id}
        tableClassName="mt-3"
      />
    </div>
  );
};
