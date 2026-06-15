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
}

export class FakeTable {
  rows: Row[] = [];
  private counter = 0;

  constructor(private idPrefix: string) {}

  query(): FakeQueryBuilder {
    return new FakeQueryBuilder(this);
  }

  run(state: BuilderState): { data: unknown; error: { message: string } | null } {
    const matches = (row: Row) => state.filters.every(([col, val]) => row[col] === val);

    if (state.mode === "insert") {
      const id = `${this.idPrefix}-${++this.counter}`;
      const row: Row = { id, ...state.payload };
      this.rows.push(row);
      if (state.selectCols) {
        const projected = project(row, state.selectCols);
        return { data: state.singleMode ? projected : [projected], error: null };
      }
      return { data: null, error: null };
    }

    if (state.mode === "update") {
      this.rows.filter(matches).forEach((row) => Object.assign(row, state.payload));
      return { data: null, error: null };
    }

    if (state.mode === "delete") {
      this.rows = this.rows.filter((row) => !matches(row));
      return { data: null, error: null };
    }

    const matched = this.rows.filter(matches);
    if (state.singleMode === "single") {
      if (matched.length === 0) return { data: null, error: { message: "not found" } };
      return { data: project(matched[0], state.selectCols!), error: null };
    }
    if (state.singleMode === "maybeSingle") {
      if (matched.length === 0) return { data: null, error: null };
      return { data: project(matched[0], state.selectCols!), error: null };
    }
    return { data: matched.map((row) => project(row, state.selectCols!)), error: null };
  }
}

class FakeQueryBuilder implements PromiseLike<{ data: unknown; error: { message: string } | null }> {
  private state: BuilderState = { filters: [], mode: "select", singleMode: null };

  constructor(private table: FakeTable) {}

  select(cols: string) {
    this.state.selectCols = cols;
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
  single() {
    this.state.singleMode = "single";
    return this;
  }
  maybeSingle() {
    this.state.singleMode = "maybeSingle";
    return this;
  }
  then<TResult1, TResult2 = never>(
    onfulfilled?: ((value: { data: unknown; error: { message: string } | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.table.run(this.state)).then(onfulfilled, onrejected);
  }
}

export class FakeSupabase {
  accounts = new FakeTable("acct");
  account_wallets = new FakeTable("wallet");

  from(table: string) {
    if (table === "accounts") return this.accounts.query();
    if (table === "account_wallets") return this.account_wallets.query();
    throw new Error(`unexpected table ${table}`);
  }
}

export function asSupabaseClient(supabase: FakeSupabase): SupabaseClient {
  return supabase as unknown as SupabaseClient;
}
