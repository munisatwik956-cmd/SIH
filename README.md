# Aerometer — Real-time Airfare Price Index for India

Aerometer is an SIH 2026 (Problem Statement 26056) prototype for a high-frequency Airfare Price Index (APIx). It compares domestic route prices across airlines and online travel aggregators, normalizes fare components, and presents price movement by route and booking window.

## What it does

- Searches representative routes such as DEL–BOM and DEL–BLR across airline and OTA sources.
- Captures origin, destination, travel date, advance-booking window, carrier, fare class, base fare, taxes, total fare, demand signal, and collection timestamp.
- Supports daily, weekly, and monthly route/lead-time weighted Jevons index construction.
- Provides price trajectory, booking-pressure, route-temperature, and normalized-ledger views.
- Requires a first-party, time-limited CAPTCHA challenge before the fare endpoint can be used.

## Interface highlights

- Airport selectors display clear labels such as `DEL (Delhi)` and `BOM (Mumbai)` while preserving IATA codes for API requests.
- The travel date uses a native calendar control and advance purchase accepts any whole number from 1 to 90 days.
- The route workbench uses accessible keyboard focus states and responsive controls.
- A custom airplane favicon is served through Next.js at `app/icon.svg`.
- **Natural trajectory charts** use a 30-point random walk with momentum and mean-reversion, rendered with Catmull-Rom → Bezier smoothing, Y-axis value labels, X-axis date labels, gradient area fill, and endpoint dots.
- All dashboard widgets (metrics, charts, bars, heatmaps) regenerate with **fresh random data on every page load** and every button click.

## Data strategy

1. **Live data via Google Flights API (SerpApi).** Set `SERPAPI_KEY` in `.env` to enable live fare collection through the Google Flights search engine.
2. **Automatic random fallback.** When `SERPAPI_KEY` is empty or not set, the backend returns randomised demo quotes. The frontend also generates fresh random data client-side when the backend is unreachable.
3. **Normalize at ingestion.** Store source, carrier, route, travel date, booking window, fare class, base fare, taxes/fees, total fare, collection timestamp, availability and a quality flag.
4. **Quality control.** Deduplicate itinerary/fare-class captures, validate fare-component sums, flag outliers, track sold-out/cancelled results, and retain source provenance.
5. **Index construction.** Compute route and booking-window price relatives, then aggregate with DGCA passenger-traffic weights. Version every basket, weight, and index run for reproducibility.
6. **Transparency.** If no approved source feed is configured, the UI explicitly labels fallback quotes as illustrative rather than live.

## Architecture

- **Frontend:** Next.js 16, React 19, CSS Modules (experience page) + Tailwind CSS (landing page). The root route presents an original lightweight CSS depth scene; no third-party 3D assets or heavy WebGL dependencies are required.
- **API:** FastAPI. `backend/main_secure.py` provides CAPTCHA, quote retrieval, source status, index metadata, and health checks. It runs on port `8000`.
- **Live data feed:** Set `SERPAPI_KEY` in `.env` to your [SerpApi](https://serpapi.com/manage-api-key) key. The backend calls the Google Flights engine to fetch real fare data.

## Local setup

### Prerequisites

- Node.js 20.9 or later
- Python 3.11 or later

### Frontend

```powershell
npm install
npm run dev
```

Open `http://localhost:3000`.

### API

```powershell
.\.venv\Scripts\Activate.ps1
pip install -r backend\requirements-live.txt
python -m uvicorn main_secure:app --app-dir backend --host 127.0.0.1 --port 8000
```

Open `http://127.0.0.1:8000/docs` for interactive API documentation.

### Configure live data (optional)

1. Get a free API key at [https://serpapi.com/manage-api-key](https://serpapi.com/manage-api-key)
2. Add it to `.env`:

```env
SERPAPI_KEY=your_key_here
```

3. Restart the backend. The `/v1/quotes` endpoint will now return live Google Flights data.

> **No API key?** No problem. The system automatically falls back to randomised demo data that refreshes on every page load and every button click.

## Demo mode behavior

When no `SERPAPI_KEY` is configured:

- **Page load:** All dashboard widgets (trajectory chart, booking pressure, route temperature, fare ledger) initialize with fresh random data.
- **"Reveal fares" / "Refresh live fares" button:** Generates new random quotes AND refreshes all dashboard widgets (trajectory chart, demand bars, heatmap, metrics) — no CAPTCHA required.
- **CAPTCHA verification:** Still available. Once verified, the system tries the backend first and falls back to random if the backend returns an error.

## CAPTCHA flow

1. The browser requests `POST /v1/captcha/challenge`.
2. The user answers the short arithmetic prompt.
3. The browser submits the answer to `POST /v1/captcha/verify` and receives a 15-minute human ticket.
4. Fare requests include that ticket in the `X-Human-Ticket` header.

This is a first-party demo CAPTCHA for local development. In a production NSO deployment, add rate limits, persistent challenge storage, observability, CSRF protection, and a managed CAPTCHA provider where appropriate.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `SERPAPI_KEY` | No | [SerpApi](https://serpapi.com) key for Google Flights data. Leave empty for random demo data. |

## Chart technology

The trajectory charts use **pure SVG** with no charting libraries:

- **Data generation:** 30-point random walk with momentum (`0.85` decay), mean-reversion toward 120, and clamping to 100–140 range.
- **Curve smoothing:** Catmull-Rom to cubic Bezier conversion with `0.3` tension for natural, organic curves.
- **Y-axis:** Adaptive gridlines with value labels (2/5/10 step based on data range).
- **X-axis:** Date labels spanning the last 30 days.
- **Visual polish:** Gradient area fill, axis lines, and endpoint dot indicator.
