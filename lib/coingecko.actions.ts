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

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-cg-demo-api-key": API_KEY,
    } as Record<string, string>,
    next: { revalidate },
    cache: revalidate === 0 ? "no-store" : "force-cache",
  });

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
}

export async function getPools(
  id: string,
  network?: string | null,
  contractAddress?: string | null,
): Promise<PoolData> {
  const fallback: PoolData = {
    id: "",
    address: "",
    name: "",
    network: "",
  };

  if (network && contractAddress) {
    try {
      const poolData = await fetcher<{ data: PoolData[] }>(
        `/onchain/networks/${network}/tokens/${contractAddress}/pools`,
      );

      return poolData.data?.[0] ?? fallback;
    } catch (error) {
      console.log(error);
      return fallback;
    }
  }

  try {
    const poolData = await fetcher<{ data: PoolData[] }>(
      "/onchain/search/pools",
      { query: id },
    );

    return poolData.data?.[0] ?? fallback;
  } catch {
    return fallback;
  }
}

export async function getTrades(
  id?: string,
  network?: string | null,
  poolAddress?: string | null,
): Promise<TradeData[]> {
  const fallback: TradeData = {
    network: "",
    poolAddress: "",
  };

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
  revalidate = 60,
): Promise<OHLCVCandle[]> {
  if (!network || !poolAddress) return [];

  const timeframeMap: Record<typeof timeframe, string> = {
    "1m": "minute",
    "1H": "hour",
    "1D": "day",
  };

  try {
    const response = await fetcher<OHLCVResponse>(
      `/onchain/networks/${network}/pools/${poolAddress}/ohlcv/${timeframeMap[timeframe]}`,
      {
        aggregate: timeframe === "1m" ? "1" : timeframe === "1H" ? "1" : "1",
        limit: 100,
      },
      revalidate,
    );

    console.log("OHLCV DATA:", response);

    return response.data?.attributes?.ohlcv_list ?? [];
  } catch (error) {
    console.log(error);
    return [];
  }
}
