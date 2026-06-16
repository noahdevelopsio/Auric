import type { SupabaseClient } from "@supabase/supabase-js";

type Row = Record<string, unknown>;

function project(row: Row, cols: string): Row {
  const out: Row = {};
  for (const key of cols.split(",").map((c) => c.trim())) {
    out[key] = row[key] ?? null;
  }
  return out;
}

interface BuilderState {
  filters: Array<[string, unknown]>;
  mode: "select" | "insert" | "update" | "delete";
  payload?: Row;
  selectCols?: string;
  singleMode: "single" | "maybeSingle" | null;
  countMode: boolean;
  orderCol?: string;
  orderAsc: boolean;
  rangeFrom?: number;
  rangeTo?: number;
}

interface RunResult {
  data: unknown;
  error: { message: string; code?: string } | null;
  count: number | null;
}

export class FakeTable {
  rows: Row[] = [];
  private counter = 0;

  constructor(private idPrefix: string) {}

  query(): FakeQueryBuilder {
    return new FakeQueryBuilder(this);
  }

  run(state: BuilderState): RunResult {
    const matches = (row: Row) => state.filters.every(([col, val]) => row[col] === val);

    if (state.mode === "insert") {
      const id = `${this.idPrefix}-${++this.counter}`;
      const row: Row = { id, created_at: new Date(this.counter * 1000).toISOString(), ...state.payload };
      this.rows.push(row);
      if (state.selectCols) {
        const projected = project(row, state.selectCols);
        return { data: state.singleMode ? projected : [projected], error: null, count: null };
      }
      return { data: null, error: null, count: null };
    }

    if (state.mode === "update") {
      this.rows.filter(matches).forEach((row) => Object.assign(row, state.payload));
      return { data: null, error: null, count: null };
    }

    if (state.mode === "delete") {
      this.rows = this.rows.filter((row) => !matches(row));
      return { data: null, error: null, count: null };
    }

    let matched = this.rows.filter(matches);
    const total = matched.length;

    if (state.orderCol) {
      const col = state.orderCol;
      matched = [...matched].sort((a, b) => {
        const av = a[col];
        const bv = b[col];
        let cmp = 0;
        if (av !== undefined && bv !== undefined && av !== null && bv !== null) {
          if (av < bv) cmp = -1;
          else if (av > bv) cmp = 1;
        }
        return state.orderAsc ? cmp : -cmp;
      });
    }

    if (state.rangeFrom !== undefined && state.rangeTo !== undefined) {
      matched = matched.slice(state.rangeFrom, state.rangeTo + 1);
    }

    if (state.singleMode === "single") {
      if (matched.length === 0) return { data: null, error: { message: "not found" }, count: null };
      return { data: project(matched[0], state.selectCols!), error: null, count: state.countMode ? total : null };
    }
    if (state.singleMode === "maybeSingle") {
      if (matched.length === 0) return { data: null, error: null, count: state.countMode ? total : null };
      return { data: project(matched[0], state.selectCols!), error: null, count: state.countMode ? total : null };
    }
    return {
      data: matched.map((row) => project(row, state.selectCols!)),
      error: null,
      count: state.countMode ? total : null,
    };
  }
}

class FakeQueryBuilder implements PromiseLike<RunResult> {
  private state: BuilderState = { filters: [], mode: "select", singleMode: null, countMode: false, orderAsc: true };

  constructor(private table: FakeTable) {}

  select(cols: string, opts?: { count?: "exact" }) {
    this.state.selectCols = cols;
    if (opts?.count === "exact") this.state.countMode = true;
    return this;
  }
  insert(payload: Row) {
    this.state.mode = "insert";
    this.state.payload = payload;
    return this;
  }
  update(payload: Row) {
    this.state.mode = "update";
    this.state.payload = payload;
    return this;
  }
  delete() {
    this.state.mode = "delete";
    return this;
  }
  eq(col: string, val: unknown) {
    this.state.filters.push([col, val]);
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.state.orderCol = col;
    this.state.orderAsc = opts?.ascending !== false;
    return this;
  }
  range(from: number, to: number) {
    this.state.rangeFrom = from;
    this.state.rangeTo = to;
    return this;
  }
  single() {
    this.state.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.state.singleMode = "maybeSingle";
    return this;
  }
  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: RunResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.table.run(this.state)).then(onfulfilled, onrejected);
  }
}

export class FakeSupabase {
  accounts = new FakeTable("acct");
  account_wallets = new FakeTable("wallet");
  ordinal_listings = new FakeTable("ord");
  solana_listings = new FakeTable("sol");

  from(table: string) {
    if (table === "accounts") return this.accounts.query();
    if (table === "account_wallets") return this.account_wallets.query();
    if (table === "ordinal_listings") return this.ordinal_listings.query();
    if (table === "solana_listings") return this.solana_listings.query();
    throw new Error(`unexpected table ${table}`);
  }
}

export function asSupabaseClient(supabase: FakeSupabase): SupabaseClient {
  return supabase as unknown as SupabaseClient;
}
