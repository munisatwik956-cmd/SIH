"""APIx collection service — adapters must only use permitted API/partner or robots-compliant flows."""
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from statistics import geometric_mean
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Aerometer APIx", version="0.1.0")

# Enable CORS for frontend at localhost:3000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@dataclass
class Quote:
    source: str; carrier: str; origin: str; destination: str; departure_date: str
    advance_days: int; fare_class: str; base_fare_inr: float; taxes_fees_inr: float
    total_fare_inr: float; captured_at: str; quality_score: float = 1.0

class Search(BaseModel):
    origin: str = Field(pattern="^[A-Z]{3}$")
    destination: str = Field(pattern="^[A-Z]{3}$")
    departure_date: str
    advance_days: int = Field(ge=1, le=90)

def sample_quotes(q: Search) -> list[Quote]:
    # Demo seed. Replace with append-only database results produced by approved adapters.
    seed = [("IndiGo","6E",5189,1022),("Air India","AI",5520,1048),("Air India Express","IX",4875,1017),("Akasa Air","QP",5030,1005),("SpiceJet","SG",4699,1018)]
    factor = 1 + (7-q.advance_days)*.013
    now = datetime.now(timezone.utc).isoformat()
    return [Quote(name,code,q.origin,q.destination,q.departure_date,q.advance_days,"Economy",round(base*factor),tax,round(base*factor)+tax,now) for name,code,base,tax in seed]

@app.post('/v1/quotes')
def quotes(search: Search):
    if search.origin == search.destination: raise HTTPException(422, 'Origin and destination must differ')
    return {'data': [asdict(x) for x in sample_quotes(search)], 'mode': 'illustrative'}

@app.get('/v1/index')
def index():
    # Jevons relative: geometric mean of quote-price relatives, scale base period to 100.
    relatives = [1.31,1.27,1.24,1.29,1.31]
    return {'name':'APIx','method':'weighted Jevons in production','base_period':'2026-01=100','value':round(100*geometric_mean(relatives),2),'frequency':'daily'}

@app.get('/health')
def health(): return {'status':'ok','collection_policy':'approved API/partner or robots-and-terms compliant adapters only'}
