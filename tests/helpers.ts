export interface Sent {
  url: string;
  method?: string;
  headers: Record<string, string>;
  body: string;
}

/** Replaces fetch with one that records the request and replies with a canned response. */
export function stubFetch(status: number, payload: unknown, headers: Record<string, string> = {}) {
  let sent: Sent | undefined;
  globalThis.fetch = (async (input: Parameters<typeof fetch>[0], init?: RequestInit) => {
    sent = {
      url: String(input),
      method: init?.method,
      headers: (init?.headers ?? {}) as Record<string, string>,
      body: String(init?.body ?? ""),
    };
    return new Response(typeof payload === "string" ? payload : JSON.stringify(payload), { status, headers });
  }) as typeof fetch;
  return { sent: () => sent! };
}
