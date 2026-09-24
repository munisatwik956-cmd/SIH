// @ts-nocheck
"use client";
import { useEffect, useState } from "react";
import s from "./page.module.css";

type Quote = {
  source: string;
  carrier: string;
  origin: string;
  destination: string;
  advance_days: number;
  fare_class: string;
  base_fare_inr: number;
  taxes_fees_inr: number;
  total_fare_inr: number;
  captured_at: string;
  demand_level?: string;
};

const AIRLINES: [string, string, string[]][] = [
  ["IndiGo", "6E", ["Saver", "Flexi", "Super 6E"]],
  ["Air India", "AI", ["Economy", "Flexi Value", "Classic"]],
  ["Air India Express", "IX", ["Value", "Flex", "Extra"]],
  ["Akasa Air", "QP", ["Saver", "Flexi", "Comfort"]],
  ["SpiceJet", "SG", ["SpiceSaver", "SpiceFlex", "SpiceMax"]],
  ["Vistara", "UK", ["Economy", "Comfort", "Premium"]],
];

const ROUTES = [
  "DEL–BOM",
  "DEL–BLR",
  "BOM–BLR",
  "DEL–CCU",
  "BLR–HYD",
  "MAA–DEL",
];

function randomQuotes(origin = "DEL", dest = "BOM", adv = 7): Quote[] {
  const factor = 1 + Math.max(0, (14 - adv) * 0.018);
  const demand = adv <= 3 ? "high" : adv <= 14 ? "moderate" : "normal";
  return AIRLINES.map(([source, carrier, classes]) => {
    const base = Math.round((3200 + Math.random() * 4300) * factor);
    const taxes = Math.round(base * (0.15 + Math.random() * 0.07));
    return {
      source,
      carrier,
      origin,
      destination: dest,
      advance_days: adv,
      fare_class: classes[Math.floor(Math.random() * classes.length)],
      base_fare_inr: base,
      taxes_fees_inr: taxes,
      total_fare_inr: base + taxes,
      captured_at: "Verification required",
      demand_level: demand,
    };
  });
}

function randomPressure(): [string, number][] {
  return [
    ["T+1", 75 + Math.floor(Math.random() * 20)],
    ["T+7", 55 + Math.floor(Math.random() * 25)],
    ["T+15", 35 + Math.floor(Math.random() * 20)],
    ["T+30", 18 + Math.floor(Math.random() * 22)],
    ["T+45", 8 + Math.floor(Math.random() * 17)],
  ];
}

function randomRouteTemps(): string[] {
  return ROUTES.map((r) => {
    const v = (-3 + Math.random() * 12).toFixed(1);
    return `${r} ${Number(v) >= 0 ? "+" : ""}${v}`;
  });
}

function randomTrajPath(): string {
  const n = 8;
  const ys: number[] = [];
  let y = 90 + Math.random() * 25;
  for (let i = 0; i < n; i++) {
    ys.push(Math.round(y));
    y = y - (8 + Math.random() * 12) + (Math.random() < 0.3 ? 10 : 0);
    y = Math.max(10, Math.min(120, y));
  }
  const xs = ys.map((_, i) => Math.round((i * 320) / (n - 1)));
  let d = `M${xs[0]} ${ys[0]}`;
  for (let i = 1; i < n; i++) {
    const mx = Math.round((xs[i - 1] + xs[i]) / 2);
    d += `C${mx} ${ys[i - 1]} ${mx} ${ys[i]} ${xs[i]} ${ys[i]}`;
  }
  return d;
}

const money = (x: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(x);

export default function Experience() {
  const [o, setO] = useState("DEL");
  const [d, setD] = useState("BOM");
  const [w, setW] = useState("7");
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [challenge, setChallenge] = useState<{
    challenge_id: string;
    prompt: string;
  } | null>(null);
  const [answer, setAnswer] = useState("");
  const [ticket, setTicket] = useState("");
  const [note, setNote] = useState("");

  /* All dashboard data is randomised on client mount to avoid hydration mismatches. */
  const [apix, setApix] = useState("—");
  const [apixDelta, setApixDelta] = useState("");
  const [medianStr, setMedianStr] = useState("—");
  const [demandLabel, setDemandLabel] = useState("—");
  const [demandNote, setDemandNote] = useState("");
  const [routeStr, setRouteStr] = useState("—");
  const [sourceStr, setSourceStr] = useState("");
  const [pressure, setPressure] = useState<[string, number][]>([]);
  const [routeTemps, setRouteTemps] = useState<string[]>([]);
  const [trajPath, setTrajPath] = useState("");

  useEffect(() => {
    /* Randomise quotes */
    setQuotes(randomQuotes());

    /* Randomise metrics */
    const ax = (122 + Math.random() * 11).toFixed(1);
    setApix(ax);
    setApixDelta(`+${(1 + Math.random() * 5).toFixed(1)}% / week`);
    const med = Math.round(5000 + Math.random() * 3500);
    setMedianStr(money(med));
    const demands = ["High", "Moderate", "Elevated"];
    const notes = ["festival uplift", "seasonal surge", "steady demand"];
    const di = Math.floor(Math.random() * demands.length);
    setDemandLabel(demands[di]);
    setDemandNote(notes[di]);
    setRouteStr(`${18 + Math.floor(Math.random() * 10)} routes`);
    setSourceStr(`${8 + Math.floor(Math.random() * 5)} monitored sources`);

    /* Randomise signal widgets */
    setPressure(randomPressure());
    setRouteTemps(randomRouteTemps());
    setTrajPath(randomTrajPath());
  }, []);

  async function unlock() {
    const r = await fetch("http://127.0.0.1:8000/v1/captcha/challenge", {
      method: "POST",
    });
    setChallenge(await r.json());
  }

  async function verify() {
    if (!challenge) return;
    const r = await fetch("http://127.0.0.1:8000/v1/captcha/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        challenge_id: challenge.challenge_id,
        answer: Number(answer),
      }),
    });
    const j = await r.json();
    if (!r.ok) {
      setNote(j.detail);
      return;
    }
    setTicket(j.ticket);
    setChallenge(null);
    setNote(
      "Human verification passed. Live collection is available for 15 minutes.",
    );
  }

  async function fares() {
    if (!ticket) {
      unlock();
      return;
    }
    const r = await fetch("http://127.0.0.1:8000/v1/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-human-ticket": ticket },
      body: JSON.stringify({
        origin: o,
        destination: d,
        departure_date: "2026-09-27",
        advance_days: Number(w),
      }),
    });
    const j = await r.json();
    if (r.ok) {
      setQuotes(j.data);
      setNote(
        j.mode === "approved-live"
          ? "Approved live fares loaded."
          : "Randomised demo data — add a SERPAPI_KEY to .env for live fares.",
      );
    } else {
      setNote(j.detail);
    }
  }

  return (
    <main className={s.main}>
      {/* ── Navigation ── */}
      <nav className={s.nav}>
        <b>
          AERO<span>METER</span>
        </b>
        <div>
          <a href="#workbench">Explore</a>
          <a href="#signals">Signals</a>
          <a href="#ledger">Ledger</a>
        </div>
        <button
          onClick={ticket ? undefined : unlock}
          className={ticket ? s.ok : s.verify}
        >
          {ticket ? "Verified" : "Verify access"} <i>↗</i>
        </button>
      </nav>

      {/* ── Hero ── */}
      <section className={s.hero}>
        <div>
          <p className={s.kicker}>INDIA AIRFARE INTELLIGENCE / APIX</p>
          <h1>
            Pricing intelligence
            <br />
            <em>above the noise.</em>
          </h1>
          <p>
            Real-time fares, lead-time pressure and route-level signals—built
            for India&apos;s evolving air market.
          </p>
          <a href="#workbench" className={s.cta}>
            Explore the index <i>↘</i>
          </a>
        </div>
        <div className={s.scene} aria-hidden="true">
          <div className={s.sun} />
          <div className={s.globe}>
            <i />
            <i />
            <i />
            <i />
          </div>
          <div className={s.wing} />
          <span className={s.alt}>38,000 FT</span>
        </div>
      </section>

      {/* ── Metrics (randomised) ── */}
      <section className={s.metrics}>
        {[
          ["India APIx", apix, apixDelta],
          ["Median fare", medianStr, "normalized quotes"],
          ["Demand signal", demandLabel, demandNote],
          ["Coverage", routeStr, sourceStr],
        ].map((x) => (
          <div key={x[0]}>
            <small>{x[0]}</small>
            <strong>{x[1]}</strong>
            <span>{x[2]}</span>
          </div>
        ))}
      </section>

      {/* ── Route workbench ── */}
      <section className={s.workbench} id="workbench">
        <div>
          <p className={s.kicker}>ROUTE WORKBENCH</p>
          <h2>
            Compare a market.
            <br />
            See the signal.
          </h2>
        </div>
        <div className={s.form}>
          {(
            [
              ["From", o, setO, ["DEL", "BOM", "BLR", "MAA", "HYD", "CCU"]],
              ["To", d, setD, ["BOM", "DEL", "BLR", "HYD", "MAA", "CCU"]],
              ["Travel", "27 Sep 2026", () => {}, ["27 Sep 2026"]],
              ["Advance", w, setW, ["1", "7", "15", "30", "45"]],
            ] as [string, string, (x: string) => void, string[]][]
          ).map(([label, value, set, options]) => (
            <label key={label}>
              <small>{label}</small>
              <select value={value} onChange={(e) => set(e.target.value)}>
                {options.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
          ))}
          <button onClick={fares}>
            Reveal fares <i>↗</i>
          </button>
        </div>
        {note && <p className={s.note}>{note}</p>}
      </section>

      {/* ── Signal widgets (all randomised) ── */}
      <section className={s.signals} id="signals">
        {/* Trajectory chart */}
        <article>
          <p className={s.kicker}>THIRTY DAY TRAJECTORY</p>
          <h2>The market is rising.</h2>
          <strong>{apix}</strong>
          <svg viewBox="0 0 320 130">
            {trajPath && (
              <path
                d={trajPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              />
            )}
          </svg>
        </article>

        {/* Booking pressure */}
        <article>
          <p className={s.kicker}>BOOKING PRESSURE</p>
          <h2>Demand meets lead time.</h2>
          {pressure.map((x) => (
            <div className={s.bar} key={x[0]}>
              <span>{x[0]}</span>
              <i>
                <b style={{ transform: `scaleX(${x[1] / 100})` }} />
              </i>
              <strong>{x[1]}%</strong>
            </div>
          ))}
        </article>

        {/* Route temperature */}
        <article>
          <p className={s.kicker}>ROUTE TEMPERATURE</p>
          <h2>Where fares moved.</h2>
          <div className={s.heat}>
            {routeTemps.map((x, i) => (
              <span className={s["h" + i]} key={x}>
                {x}
              </span>
            ))}
          </div>
        </article>
      </section>

      {/* ── Fare ledger (randomised quotes) ── */}
      <section className={s.ledger} id="ledger">
        <p className={s.kicker}>NORMALIZED FARE LEDGER</p>
        <h2>
          {o} → {d}, in detail.
        </h2>
        <div>
          <table>
            <thead>
              <tr>
                {[
                  "Source",
                  "Route",
                  "Advance",
                  "Demand",
                  "Class",
                  "Base",
                  "Taxes",
                  "Total",
                  "Captured",
                ].map((x) => (
                  <th key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, i) => (
                <tr key={q.source + i}>
                  <td>
                    <b>{q.source}</b>
                    <small>{q.carrier}</small>
                  </td>
                  <td>
                    {q.origin}–{q.destination}
                  </td>
                  <td>T+{q.advance_days}</td>
                  <td>
                    <i>{q.demand_level || "high"}</i>
                  </td>
                  <td>{q.fare_class}</td>
                  <td>{money(q.base_fare_inr)}</td>
                  <td>{money(q.taxes_fees_inr)}</td>
                  <td>
                    <strong>{money(q.total_fare_inr)}</strong>
                  </td>
                  <td>
                    {q.captured_at === "Verification required"
                      ? "Unlock to load"
                      : "just now"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── CAPTCHA modal ── */}
      {challenge && (
        <div className={s.modal}>
          <section>
            <button onClick={() => setChallenge(null)} className={s.close}>
              ×
            </button>
            <p className={s.kicker}>SECURE COLLECTION GATE</p>
            <h2>A quick human check.</h2>
            <p>This protects the collection service and source capacity.</p>
            <label>
              What is <b>{challenge.prompt}</b>?
              <input
                autoFocus
                inputMode="numeric"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && verify()}
              />
            </label>
            <button className={s.cta} onClick={verify}>
              Continue <i>↗</i>
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
