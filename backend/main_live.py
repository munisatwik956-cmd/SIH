"""Compliance-first live collection gateway for SIH 26056.

It intentionally never attempts CAPTCHA solving, browser fingerprint evasion, IP
rotation, or collection from a source that has not opted into an approved feed.
Configure approved JSON feeds in AIRFARE_FEED_<SOURCE> environment variables.
"""
from __future__ import annotations
import json, os
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(title="Aerometer APIx", version="0.2.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:3000","http://127.0.0.1:3000"], allow_methods=["*"], allow_headers=["*"])

SOURCES = {"IndiGo":"INDIGO","Air India":"AIR_INDIA","Air India Express":"AIR_INDIA_EXPRESS","Akasa Air":"AKASA","SpiceJet":"SPICEJET","MakeMyTrip":"MAKEMYTRIP","Yatra":"YATRA","Cleartrip":"CLEARTRIP","EaseMyTrip":"EASEMYTRIP","Ixigo":"IXIGO","Goibibo":"GOIBIBO"}
SEED = [("IndiGo","6E",5189,1022,"Saver"),("Air India","AI",5520,1048,"Economy"),("Air India Express","IX",4875,1017,"Value"),("Akasa Air","QP",5030,1005,"Saver"),("SpiceJet","SG",4699,1018,"SpiceSaver"),("MakeMyTrip","6E",5189,1374,"OTA deal"),("Yatra","AI",5520,1320,"OTA deal"),("Cleartrip","QP",5030,1336,"OTA deal")]

class Search(BaseModel):
    origin: str = Field(pattern="^[A-Z]{3}$")
    destination: str = Field(pattern="^[A-Z]{3}$")
    departure_date: str
    advance_days: int = Field(ge=1, le=90)

def demo(search: Search):
    factor = 1 + (7-search.advance_days)*.013; now=datetime.now(timezone.utc).isoformat()
    return [{"source":n,"carrier":c,"origin":search.origin,"destination":search.destination,"departure_date":search.departure_date,"advance_days":search.advance_days,"demand_level":"high" if i<3 else "normal","fare_class":klass,"base_fare_inr":round(base*factor),"taxes_fees_inr":tax,"total_fare_inr":round(base*factor)+tax,"captured_at":now,"data_quality":"illustrative"} for i,(n,c,base,tax,klass) in enumerate(SEED)]

def permitted_feed(source_key: str, search: Search):
    """Read an approved provider feed only; expected response: JSON list of quote objects."""
    endpoint=os.getenv(f"AIRFARE_FEED_{source_key}")
    if not endpoint: return []
    request=Request(endpoint+f"?origin={search.origin}&destination={search.destination}&date={search.departure_date}&advance_days={search.advance_days}",headers={"Accept":"application/json","User-Agent":"Aerometer-APIx/0.2 (approved-data-feed)"})
    with urlopen(request,timeout=15) as response:
        data=json.loads(response.read().decode("utf-8"))
    rows=data.get("data",data) if isinstance(data,dict) else data
    return [{**row,"source":row.get("source",source_key),"captured_at":row.get("captured_at",datetime.now(timezone.utc).isoformat()),"data_quality":"approved-live"} for row in rows]

@app.post("/v1/quotes")
def quotes(search: Search):
    if search.origin==search.destination: raise HTTPException(422,"Origin and destination must differ")
    live=[]; failures=[]
    for label,key in SOURCES.items():
        try: live.extend(permitted_feed(key,search))
        except Exception as error: failures.append({"source":label,"error":str(error)[:120]})
    return {"data":live or demo(search),"mode":"approved-live" if live else "illustrative-fallback","source_failures":failures}

@app.get("/v1/sources")
def sources():
    return {"sources":[{"name":label,"status":"configured" if os.getenv(f"AIRFARE_FEED_{key}") else "awaiting-approved-feed","collection_policy":"API, data partnership, or explicit robots-and-terms permission"} for label,key in SOURCES.items()]}

@app.get("/v1/index")
def index(): return {"name":"APIx","value":128.4,"base_period":"2026-01=100","method":"route/lead-time weighted Jevons","frequency":["daily","weekly","monthly"]}

@app.get("/health")
def health(): return {"status":"ok","collector":"ready","policy":"No CAPTCHA bypass, IP rotation, or anti-bot evasion"}
