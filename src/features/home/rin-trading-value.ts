import { queryOptions } from "@tanstack/react-query";
import { createServerFn } from "@tanstack/react-start";

export interface RinTradingValue {
  usd: number;
  transferYear: number;
  through: string;
  stale: boolean;
}

interface QlikCell {
  qText: string;
  qNum: number;
}

interface QlikLayout {
  qLayout?: { qHyperCube?: { qDataPages?: Array<{ qMatrix: QlikCell[][] }> } };
}

const EPA_APP = "73b2b6a5-70c6-4820-b3fa-186ac094f10d";
const CACHE_MS = 6 * 60 * 60 * 1000;
let lastValue: RinTradingValue | null = null;
let fetchedAt = 0;

async function fetchRinTradingValue(): Promise<RinTradingValue> {
  const socket = new WebSocket(`wss://edap.epa.gov/public/app/${EPA_APP}`);
  let nextId = 0;
  const pending = new Map<
    number,
    { resolve: (value: unknown) => void; reject: (error: Error) => void }
  >();
  let rejectConnection: ((error: Error) => void) | null = null;
  const fail = (error: Error) => {
    rejectConnection?.(error);
    for (const request of pending.values()) request.reject(error);
    pending.clear();
  };
  const timeout = setTimeout(() => {
    fail(new Error("EPA query timed out"));
    socket.close();
  }, 10_000);
  socket.onerror = () => fail(new Error("EPA dashboard connection failed"));
  socket.onclose = () => fail(new Error("EPA dashboard connection closed"));

  const call = (handle: number, method: string, params: unknown[] = []) =>
    new Promise<unknown>((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      socket.send(JSON.stringify({ jsonrpc: "2.0", id, handle, method, params }));
    });

  try {
    await new Promise<void>((resolve, reject) => {
      rejectConnection = reject;
      socket.onopen = () => resolve();
    });
    rejectConnection = null;
    socket.onmessage = (event) => {
      const message = JSON.parse(String(event.data));
      const request = pending.get(message.id);
      if (!request) return;
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message ?? "EPA query failed"));
      else request.resolve(message.result);
    };

    const doc = (await call(-1, "OpenDoc", [EPA_APP])) as { qReturn: { qHandle: number } };
    const object = (await call(doc.qReturn.qHandle, "CreateSessionObject", [
      {
        qInfo: { qType: "rin-trading-value" },
        qHyperCubeDef: {
          qDimensions: [{ qDef: { qFieldDefs: ["Price_YEAR_TRANSFER"] } }],
          // EPA's price table is for separated RINs. Its numerator is price × RIN quantity.
          qMeasures: [
            { qDef: { qDef: "Sum(Price_INTERMEDIATE_PRICE)" } },
            {
              qDef: {
                qDef: "Date(Max([Price_Transfer Date by week.autoCalendar.Date]),'YYYY-MM-DD')",
              },
            },
          ],
          qInitialDataFetch: [{ qWidth: 3, qHeight: 30 }],
        },
      },
    ])) as { qReturn: { qHandle: number } };
    const layout = (await call(object.qReturn.qHandle, "GetLayout")) as QlikLayout;
    const rows = layout.qLayout?.qHyperCube?.qDataPages?.[0]?.qMatrix ?? [];
    const values = rows
      .map((row) => ({
        transferYear: Number(row[0]?.qNum),
        usd: Number(row[1]?.qNum),
        through: row[2]?.qText ?? "",
      }))
      .filter(
        (row) =>
          Number.isInteger(row.transferYear) &&
          Number.isFinite(row.usd) &&
          row.usd > 0 &&
          /^\d{4}-\d{2}-\d{2}$/.test(row.through),
      );
    const latest = values.sort((a, b) => b.transferYear - a.transferYear)[0];
    if (!latest) throw new Error("EPA RIN trading data unavailable");
    return { ...latest, stale: false };
  } finally {
    clearTimeout(timeout);
    socket.close();
  }
}

export const getRinTradingValueFn = createServerFn({ method: "GET" }).handler(
  async (): Promise<RinTradingValue | null> => {
    if (lastValue && Date.now() - fetchedAt < CACHE_MS) return lastValue;
    try {
      lastValue = await fetchRinTradingValue();
      fetchedAt = Date.now();
      return lastValue;
    } catch {
      return lastValue ? { ...lastValue, stale: true } : null;
    }
  },
);

export const rinTradingValueQuery = queryOptions({
  queryKey: ["us-rin-trading-value"],
  queryFn: () => getRinTradingValueFn(),
  staleTime: CACHE_MS,
  refetchInterval: CACHE_MS,
});
