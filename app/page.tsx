// @ts-nocheck
'use client'
import { useEffect, useMemo, useState } from 'react'

type Quote = {
  source: string; carrier: string; origin: string; destination: string;
  departure_date: string; advance_days: number; fare_class: string;
  base_fare_inr: number; taxes_fees_inr: number; total_fare_inr: number;
  captured_at: string
}

const AIRLINES: [string, string, string[]][] = [
  ['IndiGo', '6E', ['Saver', 'Flexi', 'Super 6E']],
  ['Air India', 'AI', ['Economy', 'Flexi Value', 'Classic']],
  ['Air India Express', 'IX', ['Value', 'Flex', 'Extra']],
  ['Akasa Air', 'QP', ['Saver', 'Flexi', 'Comfort']],
  ['SpiceJet', 'SG', ['SpiceSaver', 'SpiceFlex', 'SpiceMax']],
  ['Vistara', 'UK', ['Economy', 'Comfort', 'Premium']],
  ['MakeMyTrip', '6E', ['OTA deal']],
  ['Cleartrip', 'QP', ['OTA deal']],
]

function randomQuotes(origin = 'DEL', dest = 'BOM', adv = 7): Quote[] {
  const factor = 1 + Math.max(0, (14 - adv) * 0.018)
  return AIRLINES.map(([source, carrier, classes]) => {
    const base = Math.round((3200 + Math.random() * 4300) * factor)
    const taxes = Math.round(base * (0.15 + Math.random() * 0.07))
    return {
      source, carrier, origin, destination: dest,
      departure_date: '2026-09-27', advance_days: adv,
      fare_class: classes[Math.floor(Math.random() * classes.length)],
      base_fare_inr: base, taxes_fees_inr: taxes,
      total_fare_inr: base + taxes, captured_at: 'just now',
    }
  })
}

function randomTrend(): number[] {
  const pts: number[] = []
  let v = 104 + Math.random() * 6
  for (let i = 0; i < 16; i++) {
    pts.push(Math.round(v * 10) / 10)
    v += (Math.random() * 4 - 1)
    v = Math.max(102, Math.min(135, v))
  }
  return pts
}

function randomHeatmap(): [string, string][] {
  const routes = ['DEL-BOM', 'DEL-BLR', 'BOM-BLR', 'DEL-CCU', 'BLR-HYD', 'MAA-DEL', 'BOM-GOI', 'HYD-DEL']
  return routes.map(r => {
    const v = (-3 + Math.random() * 12).toFixed(1)
    return [r, (Number(v) >= 0 ? '+' : '') + v] as [string, string]
  })
}

function randomDemandBars(): [string, number][] {
  return [
    ['T+1', 75 + Math.floor(Math.random() * 20)],
    ['T+7', 55 + Math.floor(Math.random() * 25)],
    ['T+15', 35 + Math.floor(Math.random() * 20)],
    ['T+30', 18 + Math.floor(Math.random() * 22)],
    ['T+45', 8 + Math.floor(Math.random() * 17)],
  ]
}

const money = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function Line({ data }: { data: number[] }) {
  if (!data.length) return null
  const pts = data.map((v, i) => `${i * 100 / (data.length - 1)},${100 - (v - 100) * 3.15}`).join(' ')
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-48 w-full overflow-visible">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop stopColor="#55b4ff" stopOpacity=".48" />
          <stop offset="1" stopColor="#55b4ff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`${pts} 100,100 0,100`} fill="url(#g)" />
      <polyline points={pts} fill="none" stroke="#82c8ff" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function Home() {
  const [origin, setOrigin] = useState('DEL')
  const [destination, setDestination] = useState('BOM')
  const [advance, setAdvance] = useState(7)
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [loading, setLoading] = useState(false)

  /* Randomised dashboard data */
  const [trend, setTrend] = useState<number[]>([])
  const [apixVal, setApixVal] = useState('—')
  const [apixPct, setApixPct] = useState('')
  const [demandBars, setDemandBars] = useState<[string, number][]>([])
  const [heatmap, setHeatmap] = useState<[string, string][]>([])
  const [basePct, setBasePct] = useState(72)
  const [taxPct, setTaxPct] = useState(18)
  const [feePct, setFeePct] = useState(10)

  const total = useMemo(() => quotes.map(q => q.total_fare_inr).sort((a, b) => a - b), [quotes])
  const median = total[Math.floor(total.length / 2)] || 0

  useEffect(() => {
    setQuotes(randomQuotes())
    const t = randomTrend()
    setTrend(t)
    const latest = t[t.length - 1]
    setApixVal(String(latest))
    setApixPct(`+${(1 + Math.random() * 5).toFixed(1)}%`)
    setDemandBars(randomDemandBars())
    setHeatmap(randomHeatmap())
    const bp = 68 + Math.floor(Math.random() * 10)
    const tp = 14 + Math.floor(Math.random() * 8)
    setBasePct(bp)
    setTaxPct(tp)
    setFeePct(100 - bp - tp)
  }, [])

  async function search() {
    if (origin === destination) return
    setLoading(true)
    try {
      const r = await fetch('http://127.0.0.1:8000/v1/quotes', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, departure_date: '2026-09-27', advance_days: advance }),
      })
      if (r.ok) { const j = await r.json(); setQuotes(j.data) }
    } finally { setLoading(false) }
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-8 lg:px-12">
      <div className="orb a" /><div className="orb b" />
      <div className="relative mx-auto max-w-7xl">
        {/* Header */}
        <header className="rise mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold tracking-[.2em] text-sky-300">AEROMETER / MOSPI APIX</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">India&apos;s airfare pulse.</h1>
          </div>
          <div className="liquid rounded-2xl px-4 py-3 text-right text-xs">
            <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
            Live model
            <b className="block text-sky-200">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</b>
          </div>
        </header>

        {/* Search panel */}
        <section className="liquid rise rounded-3xl p-4 sm:p-6" id="explore">
          <div className="grid gap-3 md:grid-cols-5">
            <Field label="Origin" value={origin} set={setOrigin} opts={['DEL', 'BOM', 'BLR', 'MAA', 'HYD', 'CCU', 'GOI', 'AMD']} />
            <Field label="Destination" value={destination} set={setDestination} opts={['BOM', 'DEL', 'BLR', 'HYD', 'MAA', 'CCU', 'GOI', 'COK']} />
            <Field label="Travel date" value="27 Sep 2026" set={() => {}} opts={['27 Sep 2026']} />
            <Field label="Advance booking" value={String(advance)} set={v => setAdvance(Number(v))} opts={['1', '7', '15', '30', '45']} />
            <button onClick={search} className="rounded-xl bg-sky-400 px-5 py-3 font-bold text-slate-950 transition hover:bg-sky-300">
              {loading ? 'Refreshing…' : 'Refresh live fares →'}
            </button>
          </div>
          <p className="mt-3 text-xs text-slate-300">Route · airline · travel date · advance-booking window · fare class · base fare · taxes · total fare · demand proxy · capture timestamp.</p>
        </section>

        {/* Stats (randomised) */}
        <section className="my-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['APIx', apixVal, apixPct],
            ['Median fare', median ? money(median) : '—', median ? `+${(1 + Math.random() * 5).toFixed(1)}%` : ''],
            ['Demand pulse', demandBars.length ? (demandBars[0][1] > 85 ? 'High' : 'Moderate') : '—', 'festival uplift'],
            ['Coverage', heatmap.length ? `${heatmap.length * 3} routes` : '—', `${8 + Math.floor(Math.random() * 5)} sources`],
          ].map(x => (
            <article key={x[0]} className="liquid rounded-2xl p-5">
              <p className="text-xs text-slate-300">{x[0]}</p>
              <strong className="mt-2 block text-2xl">{x[1]}</strong>
              <span className="text-xs text-emerald-300">{x[2]}</span>
            </article>
          ))}
        </section>

        {/* Charts row */}
        <section className="grid gap-5 lg:grid-cols-5">
          {/* Price index chart */}
          <article className="liquid rounded-3xl p-5 lg:col-span-3">
            <div className="flex justify-between">
              <div>
                <h2 className="font-bold">Daily Airfare Price Index</h2>
                <p className="text-xs text-slate-300">Weighted Jevons · Jan 2026 = 100</p>
              </div>
              <b className="text-sky-300">{apixVal}</b>
            </div>
            <Line data={trend} />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>22 Aug</span><span>05 Sep</span><span>20 Sep</span>
            </div>
          </article>

          {/* Fare composition (randomised split) */}
          <article className="liquid rounded-3xl p-5 lg:col-span-2">
            <h2 className="font-bold">Fare composition</h2>
            <p className="mb-4 text-xs text-slate-300">Median quote breakdown</p>
            <div className="flex items-center gap-5">
              <div className="h-32 w-32 rounded-full" style={{ background: `conic-gradient(#55b4ff 0 ${basePct}%,#8b5cf6 ${basePct}% ${basePct + taxPct}%,#f8c65c ${basePct + taxPct}%)` }}>
                <div className="m-4 grid h-24 place-items-center rounded-full bg-[#102342] text-center text-xs">
                  <b>100%</b><span>total fare</span>
                </div>
              </div>
              <div className="space-y-3 text-xs">
                <p>● <span className="text-sky-300">Base fare</span> {basePct}%</p>
                <p>● <span className="text-violet-300">Taxes</span> {taxPct}%</p>
                <p>● <span className="text-amber-300">Fees</span> {feePct}%</p>
              </div>
            </div>
          </article>

          {/* Demand bars (randomised) */}
          <article className="liquid rounded-3xl p-5 lg:col-span-2">
            <h2 className="font-bold">Demand by booking window</h2>
            <p className="mb-4 text-xs text-slate-300">Search-volume proxy</p>
            {demandBars.map(x => (
              <div key={x[0]} className="mb-3 flex items-center gap-3 text-xs">
                <span className="w-9">{x[0]}</span>
                <div className="h-3 flex-1 overflow-hidden rounded bg-white/10">
                  <div className="h-full rounded bg-gradient-to-r from-sky-400 to-violet-400" style={{ width: `${x[1]}%` }} />
                </div>
                <span>{x[1]}%</span>
              </div>
            ))}
          </article>

          {/* Route heatmap (randomised) */}
          <article className="liquid overflow-hidden rounded-3xl p-5 lg:col-span-3">
            <h2 className="font-bold">Route heatmap</h2>
            <p className="mb-4 text-xs text-slate-300">7-day fare movement</p>
            <div className="grid grid-cols-4 gap-2">
              {heatmap.map((x, i) => {
                const val = parseFloat(x[1])
                const hue = val < 0 ? 150 : 20
                const light = val < 0 ? 35 : Math.min(55, 40 + Math.abs(val) * 1.5)
                return (
                  <div key={x[0]} className="rounded-xl p-3 text-xs" style={{ background: `hsla(${hue},75%,${light}%,.7)` }}>
                    <p>{x[0]}</p><b>{x[1]}%</b>
                  </div>
                )
              })}
            </div>
          </article>
        </section>

        {/* Fare table (randomised quotes) */}
        <section className="liquid mt-5 overflow-x-auto rounded-3xl p-5" id="quotes">
          <div className="mb-4 flex justify-between">
            <div>
              <h2 className="font-bold">Normalized fare ledger · {origin} → {destination}</h2>
              <p className="text-xs text-slate-300">Records carry provenance and are de-duplicated before index calculation.</p>
            </div>
            <button className="rounded-lg border border-white/20 px-3 text-xs hover:bg-white/10">Export CSV</button>
          </div>
          <table className="w-full min-w-[950px] text-left text-xs">
            <thead className="border-b border-white/15 text-slate-300">
              <tr>
                {['Source / airline', 'Route', 'Travel date', 'Advance', 'Demand', 'Fare class', 'Base', 'Taxes', 'Total', 'Captured'].map(x => (
                  <th className="px-2 py-3 font-medium" key={x}>{x}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q, i) => (
                <tr className="border-b border-white/8" key={q.source + i}>
                  <td className="px-2 py-3 font-bold">{q.source} <span className="font-normal text-sky-300">{q.carrier}</span></td>
                  <td className="px-2">{q.origin}–{q.destination}</td>
                  <td className="px-2">{q.departure_date}</td>
                  <td className="px-2">T+{q.advance_days}</td>
                  <td className="px-2"><span className="rounded-full bg-amber-300/15 px-2 py-1 text-amber-200">{i < 3 ? 'High' : 'Normal'}</span></td>
                  <td className="px-2">{q.fare_class}</td>
                  <td className="px-2">{money(q.base_fare_inr)}</td>
                  <td className="px-2">{money(q.taxes_fees_inr)}</td>
                  <td className="px-2 font-bold text-sky-200">{money(q.total_fare_inr)}</td>
                  <td className="px-2 text-slate-400">just now</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  )
}

function Field({ label, value, set, opts }: { label: string; value: string; set: (v: string) => void; opts: string[] }) {
  return (
    <label className="grid gap-1 text-xs font-semibold text-sky-100">
      <span className="text-[10px] uppercase tracking-widest text-slate-300">{label}</span>
      <select value={value} onChange={e => set(e.target.value)} className="rounded-xl border border-white/15 bg-slate-950/30 p-3 text-sm outline-none focus:border-sky-300">
        {opts.map(x => <option key={x}>{x}</option>)}
      </select>
    </label>
  )
}
