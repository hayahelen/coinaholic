"use client";

import {
  getCandlestickConfig,
  getChartConfig,
  LIVE_INTERVAL_BUTTONS,
  PERIOD_BUTTONS,
  PERIOD_CONFIG,
} from "@/constants";
import { fetcher } from "@/lib/coingecko.actions";
import { convertOHLCData } from "@/lib/utils";
import {
  CandlestickSeries,
  createChart,
  IChartApi,
  ISeriesApi,
} from "lightweight-charts";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";

const toSeconds = (ts: number) =>
  ts > 1_000_000_000_000 ? Math.floor(ts / 1000) : ts;
const normalizeHistorical = (data: OHLCData[] = []): OHLCData[] =>
  data.map(([t, o, h, l, c]) => [toSeconds(t), o, h, l, c]);

const normalizeLive = (data: OHLCVCandle[] = []): OHLCData[] =>
  data.map(([t, o, h, l, c]) => [toSeconds(t), o, h, l, c]);

const mergeCandles = (
  historical: OHLCData[],
  live: OHLCVCandle[],
): OHLCData[] => {
  const map = new Map<number, OHLCData>();

  for (const candle of normalizeHistorical(historical)) {
    map.set(candle[0], candle);
  }

  for (const candle of normalizeLive(live)) {
    map.set(candle[0], candle);
  }

  return [...map.values()].sort((a, b) => a[0] - b[0]);
};

const CandlestickChart = ({
  children,
  data,
  coinId,
  height = 360,
  initialPeriod = "daily",
  liveOhlcv = null,
  mode = "historical",
  liveInterval,
  setLiveInterval,
}: CandlestickChartProps) => {
  const chartContainerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const prevOhlcDataLength = useRef<number>(data?.length || 0);

  const [period, setPeriod] = useState(initialPeriod);
  const [ohlcData, setOhlcData] = useState<OHLCData[]>(data ?? []);

  const [isPending, startTransition] = useTransition();
  const didInitialFit = useRef(false);
  const fetchOHLCData = async (selectedPeriod: Period) => {
    try {
      const { days } = PERIOD_CONFIG[selectedPeriod];
      const newData = await fetcher<OHLCData[]>(`/coins/${coinId}/ohlc`, {
        vs_currency: "usd",
        days,
        precision: "full",
      });

      startTransition(() => {
        setOhlcData(newData ?? []);
        didInitialFit.current = false;
      });
    } catch (e) {
      console.error(
        `[CandlestickChart] Failed to fetch OHLC data for period ${selectedPeriod}`,
        e,
      );
    }
  };

  const handlePeriodChange = (newPeriod: Period) => {
    if (newPeriod === period) return;

    //TODO update period
    setPeriod(newPeriod);
    fetchOHLCData(newPeriod);
  };

  const mergedData = useMemo(() => {
    if (mode === "live") {
      return mergeCandles(ohlcData, liveOhlcv ?? []);
    }
    return normalizeHistorical(ohlcData);
  }, [ohlcData, liveOhlcv, mode]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container) return;

    const showTime = ["daily", "weekly", "monthly"].includes(period);

    const chart = createChart(container, {
      ...getChartConfig(height, showTime),
      width: container.clientWidth,
    });

    const series = chart.addSeries(CandlestickSeries, getCandlestickConfig());
    chartRef.current = chart;
    candleSeriesRef.current = series;

    const observer = new ResizeObserver((entries) => {
      if (!entries.length) return;
      chart.applyOptions({ width: entries[0].contentRect.width });
    });
    observer.observe(container);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleSeriesRef.current = null;
    };
  }, [height, period, ohlcData]);

  useEffect(() => {
    if (!candleSeriesRef.current || !chartRef.current) return;

    const converted = convertOHLCData(mergedData);
    candleSeriesRef.current.setData(converted);

    if (!didInitialFit.current && converted.length > 0) {
      chartRef.current.timeScale().fitContent();
      didInitialFit.current = true;
      return;
    }

    if (mode === "live") {
      chartRef.current.timeScale().scrollToRealTime();
    }
  }, [mergedData, mode]);

  return (
    <div id="candlestick-chart">
      <div className="chart-header">
        <div className="flex-1">{children}</div>
        <div className="button-group">
          <span className="text-sm mx-2 font-medium text-purple-100/50">
            Period:
          </span>
          {PERIOD_BUTTONS.map(({ value, label }) => (
            <button
              key={value}
              className={
                period === value ? "config-button-active" : "config-button"
              }
              onClick={() => handlePeriodChange(value)}
              disabled={isPending}
            >
              {label}
            </button>
          ))}
        </div>
        {liveInterval && (
          <div className="button-group">
            <span className="text-sm mx-2 font-medium text-purple-100/50">
              Update Frequency
            </span>
            {LIVE_INTERVAL_BUTTONS.map(({ value, label }) => (
              <button
                key={value}
                className={
                  liveInterval === value
                    ? "config-button-active"
                    : "config-button"
                }
                onClick={() => setLiveInterval && setLiveInterval(value)}
                disabled={isPending}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={chartContainerRef} className="chart" style={{ height }} />
    </div>
  );
};

export default CandlestickChart;
