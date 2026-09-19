-- Historique des écarts : un snapshot par créneau de 30 min.
create table if not exists snapshots (
  id serial primary key,
  slot integer not null unique,
  taken_at timestamptz not null default now()
);

create table if not exists funding_points (
  snapshot_id integer not null references snapshots (id) on delete cascade,
  symbol text not null,
  venue text not null,
  long_apr real not null,
  short_apr real not null
);

create table if not exists venue_checks (
  snapshot_id integer not null references snapshots (id) on delete cascade,
  venue text not null,
  ratio real,
  n integer,
  status text
);

-- Observations d’intervalle Carbon (1 / 4 / 8 h) persistées entre redémarrages.
create table if not exists carbon_intervals (
  market text not null,
  hours integer not null,
  seen_at timestamptz not null,
  primary key (market, hours)
);

create index if not exists funding_points_symbol_venue_idx
  on funding_points (symbol, venue, snapshot_id);

create index if not exists funding_points_snapshot_idx
  on funding_points (snapshot_id);

create index if not exists venue_checks_snapshot_idx
  on venue_checks (snapshot_id);

create index if not exists snapshots_taken_at_idx
  on snapshots (taken_at);

create index if not exists carbon_intervals_seen_at_idx
  on carbon_intervals (seen_at);
