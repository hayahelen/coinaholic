"use server";

import qs from "query-string";

const BASE_URL = process.env.COINGECKO_BASE_URL;
const API_KEY = process.env.COINGECKO_API_KEY;

if (!BASE_URL) throw new Error("Could not get base url");
if (!API_KEY) throw new Error("Could not get api key");

export async function fetcher<T>(
  endpoint: string,
  params?: QueryParams,
  revalidate = 60,
): Promise<T> {
  const url = qs.stringifyUrl(
    {
      url: `${BASE_URL}${endpoint}`,
      query: params,
    },
    { skipEmptyString: true, skipNull: true },
  );

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10_000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "x-cg-demo-api-key": API_KEY,
      } as Record<string, string>,
      next: { revalidate },
      cache: revalidate === 0 ? "no-store" : "force-cache",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    console.log("Fetching URL:", url);

    if (!response.ok) {
      const errorBody: CoinGeckoErrorBody = await response
        .json()
        .catch(() => ({}));
      throw new Error(
        `API Error: ${response.status}: ${errorBody.error || response.statusText}`,
      );
    }

    return response.json();
  } catch (error: any) {
    clearTimeout(timeout);

    if (error?.name === "AbortError") {
      throw new Error("CoinGecko request timed out (aborted after 10s)");
    }

    throw error;
  }
}

function normalizePool(pool: any): PoolData {
  return {
    id: pool?.id ?? "",
    attributes: {
      address: pool?.attributes?.address ?? "",
      name: pool?.attributes?.name ?? "",
      network: pool?.attributes?.network ?? "",
    },
  };
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {
    id: "",
    attributes: {
      address: "",
      name: "",
      network: "",
    },
  };

  try {
    const poolData = await fetcher<{ data: any[] }>(
      "/onchain/search/pools",
      { query: id },
      60,
    );

    if (!poolData.data?.length) return fallback;

    // Prefer pools whose name starts with the actual coin
    const bestPool =
      poolData.data.find((pool) =>
        pool.attributes?.name?.toLowerCase().startsWith(id.toLowerCase()),
      ) ||
      poolData.data.find((pool) =>
        pool.attributes?.name?.toLowerCase().includes("/usd"),
      ) ||
      poolData.data[0];

    return normalizePool(bestPool);
  } catch (error) {
    console.error(error);
    return fallback;
  }
}

export async function getTrades(
  id?: string,
  network?: string | null,
  poolAddress?: string | null,
): Promise<TradeData[]> {
  const fallback: TradeData[] = [];

  console.log(
    "Getting trades with network:",
    network,
    "and poolAddress:",
    poolAddress,
  );

  if (network && poolAddress) {
    try {
      const tradeData = await fetcher<{ data: TradeData[] }>(
        `/onchain/networks/${network}/pools/${poolAddress}/trades`,
        {},
        60,
      );

      console.log("TRAAAAAAAAAAAAAAADES", tradeData);

      return tradeData.data ?? fallback;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  try {
    const tradeData = await fetcher<{ data: TradeData[] }>(
      "/onchain/search/trades",
      { query: id },
    );

    return tradeData.data ?? fallback;
  } catch {
    return [];
  }
}

export async function getOHLCVData(
  id?: string,
  network?: string | null,
  poolAddress?: string | null,
  timeframe: "1m" | "1H" | "1D" = "1m",
): Promise<OHLCVResponse | null> {
  if (!network || !poolAddress) return null;

  const timeframeMap: Record<typeof timeframe, string> = {
    "1m": "minute",
    "1H": "hour",
    "1D": "day",
  };

  try {
    const response = await fetcher<OHLCVResponse>(
      `/onchain/networks/${network}/pools/${poolAddress}/ohlcv/${timeframeMap[timeframe]}`,
      {
        aggregate: "1",
        limit: 100,
        currency: "usd",
        token: "base",
        include_empty_intervals: true,
      },
      0,
    );

    console.log("OHLCV DATA:", response);
    console.log(
      "OHLCV >>>>>>>>>>>>>>>>>>>>>>>:",
      response.data?.attributes?.ohlcv_list,
    );

    return response
  } catch (error) {
    console.log(error);
    return null;
  }
}
