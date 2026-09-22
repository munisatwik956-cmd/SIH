# Aerometer — Real-time Airfare Price Index for India

Aerometer is an SIH 2026 (Problem Statement 26056) prototype for a high-frequency Airfare Price Index (APIx). It compares domestic route prices across airlines and online travel aggregators, normalizes fare components, and presents price movement by route and booking window.

## What it does

- Searches representative routes such as DEL–BOM and DEL–BLR across airline and OTA sources.
- Captures origin, destination, travel date, advance-booking window, carrier, fare class, base fare, taxes, total fare, demand signal, and collection timestamp.
- Supports daily, weekly, and monthly route/lead-time weighted Jevons index construction.
- Provides price trajectory, booking-pressure, route-temperature, and normalized-ledger views.
- Requires a first-party, time-limited CAPTCHA challenge before the fare endpoint can be used.

## Data strategy

1. **Use approved data paths.** Each collector is configured through an approved API, data partnership, or explicit robots-and-terms permission. It deliberately does not bypass CAPTCHAs, evade anti-bot systems, or rotate IP addresses.
2. **Normalize at ingestion.** Store source, carrier, route, travel date, booking window, fare class, base fare, taxes/fees, total fare, collection timestamp, availability and a quality flag.
3. **Quality control.** Deduplicate itinerary/fare-class captures, validate fare-component sums, flag outliers, track sold-out/cancelled results, and retain source provenance.
4. **Index construction.** Compute route and booking-window price relatives, then aggregate with DGCA passenger-traffic weights. Version every basket, weight, and index run for reproducibility.
5. **Transparency.** If no approved source feed is configured, the UI explicitly labels fallback quotes as illustrative rather than live.

## Architecture

- **Frontend:** Next.js 16, React 19, Tailwind CSS. The root route presents an original lightweight CSS depth scene; no third-party 3D assets or heavy WebGL dependencies are required.
- **API:** FastAPI. `backend/main_secure.py` provides CAPTCHA, quote retrieval, source status, index metadata, and health checks.
- **Approved feed contract:** Set `AIRFARE_FEED_<SOURCE>` to an approved JSON endpoint. It receives `origin`, `destination`, `date`, and `advance_days` query parameters and returns either an array of quote records or `{ "data": [...] }`.

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

### Configure an approved source feed

```powershell
$env:AIRFARE_FEED_INDIGO = "https://approved-provider.example/indigo/quotes"
$env:AIRFARE_FEED_AIR_INDIA = "https://approved-provider.example/air-india/quotes"
```

Restart the API after setting feed variables. `GET /v1/sources` shows which feeds are configured.

## CAPTCHA flow

1. The browser requests `POST /v1/captcha/challenge`.
2. The user answers the short arithmetic prompt.
3. The browser submits the answer to `POST /v1/captcha/verify` and receives a 15-minute human ticket.
4. Fare requests include that ticket in the `X-Human-Ticket` header.

This is a first-party demo CAPTCHA for local development. In a production NSO deployment, add rate limits, persistent challenge storage, observability, CSRF protection, and a managed CAPTCHA provider where appropriate.
