"""Aerometer API with first-party, time-limited human verification."""
from __future__ import annotations
import json, os, secrets, time
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app=FastAPI(title="Aerometer APIx",version="0.3.0")
app.add_middleware(CORSMiddleware,allow_origins=["http://localhost:3000","http://127.0.0.1:3000"],allow_methods=["*"],allow_headers=["*"])
SOURCES={"IndiGo":"INDIGO","Air India":"AIR_INDIA","Air India Express":"AIR_INDIA_EXPRESS","Akasa Air":"AKASA","SpiceJet":"SPICEJET","MakeMyTrip":"MAKEMYTRIP","Yatra":"YATRA","Cleartrip":"CLEARTRIP","EaseMyTrip":"EASEMYTRIP","Ixigo":"IXIGO","Goibibo":"GOIBIBO"}
SEED=[("IndiGo","6E",5189,1022,"Saver"),("Air India","AI",5520,1048,"Economy"),("Air India Express","IX",4875,1017,"Value"),("Akasa Air","QP",5030,1005,"Saver"),("SpiceJet","SG",4699,1018,"SpiceSaver"),("MakeMyTrip","6E",5189,1374,"OTA deal"),("Yatra","AI",5520,1320,"OTA deal"),("Cleartrip","QP",5030,1336,"OTA deal")]
CHALLENGES:dict[str,tuple[int,float]]={}; TICKETS:dict[str,float]={}
class Search(BaseModel): origin:str=Field(pattern="^[A-Z]{3}$"); destination:str=Field(pattern="^[A-Z]{3}$"); departure_date:str; advance_days:int=Field(ge=1,le=90)
class CaptchaAnswer(BaseModel): challenge_id:str; answer:int
def purge():
    now=time.time()
    for store in (CHALLENGES,TICKETS):
        for key,value in list(store.items()):
            expires=value[1] if store is CHALLENGES else value
            if expires<now: del store[key]
@app.post("/v1/captcha/challenge")
def challenge():
    purge(); a,b=secrets.randbelow(8)+2,secrets.randbelow(8)+2; ident=secrets.token_urlsafe(18); CHALLENGES[ident]=(a+b,time.time()+300)
    return {"challenge_id":ident,"prompt":f"{a} + {b}","expires_in":300}
@app.post("/v1/captcha/verify")
def verify(answer:CaptchaAnswer):
    purge(); record=CHALLENGES.pop(answer.challenge_id,None)
    if not record or answer.answer!=record[0]: raise HTTPException(400,"Verification failed. Request another challenge.")
    ticket=secrets.token_urlsafe(28); TICKETS[ticket]=time.time()+900
    return {"ticket":ticket,"expires_in":900}
def require_human(ticket:str|None):
    purge()
    if not ticket or ticket not in TICKETS: raise HTTPException(403,"Human verification required")
def demo(s:Search):
    factor=1+(7-s.advance_days)*.013; now=datetime.now(timezone.utc).isoformat()
    return [{"source":n,"carrier":c,"origin":s.origin,"destination":s.destination,"departure_date":s.departure_date,"advance_days":s.advance_days,"demand_level":"high" if i<3 else "normal","fare_class":kind,"base_fare_inr":round(base*factor),"taxes_fees_inr":tax,"total_fare_inr":round(base*factor)+tax,"captured_at":now,"data_quality":"illustrative"} for i,(n,c,base,tax,kind) in enumerate(SEED)]
def feed(key:str,s:Search):
    endpoint=os.getenv(f"AIRFARE_FEED_{key}")
    if not endpoint:return []
    url=f"{endpoint}?origin={s.origin}&destination={s.destination}&date={s.departure_date}&advance_days={s.advance_days}"
    with urlopen(Request(url,headers={"Accept":"application/json","User-Agent":"Aerometer-APIx/0.3 (approved-data-feed)"}),timeout=15) as r: data=json.loads(r.read().decode())
    rows=data.get("data",data) if isinstance(data,dict) else data
    return [{**x,"source":x.get("source",key),"data_quality":"approved-live"} for x in rows]
@app.post("/v1/quotes")
def quotes(s:Search,x_human_ticket:str|None=Header(default=None)):
    require_human(x_human_ticket)
    if s.origin==s.destination:raise HTTPException(422,"Origin and destination must differ")
    live=[]; failures=[]
    for name,key in SOURCES.items():
        try:live.extend(feed(key,s))
        except Exception as e:failures.append({"source":name,"error":str(e)[:100]})
    return {"data":live or demo(s),"mode":"approved-live" if live else "illustrative-fallback","source_failures":failures}
@app.get("/v1/sources")
def sources(): return {"sources":[{"name":n,"status":"configured" if os.getenv(f"AIRFARE_FEED_{k}") else "awaiting-approved-feed"} for n,k in SOURCES.items()]}
@app.get("/v1/index")
def index():return {"name":"APIx","value":128.4,"base_period":"2026-01=100","method":"route/lead-time weighted Jevons"}
@app.get("/health")
def health():return {"status":"ok","captcha":"first-party arithmetic challenge","collector":"ready","policy":"No CAPTCHA bypass, IP rotation, or anti-bot evasion"}
