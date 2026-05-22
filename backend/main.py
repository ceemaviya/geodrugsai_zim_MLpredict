from fastapi import Depends, FastAPI, Header, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
import os
import pandas as pd
import joblib
import secrets
from io import BytesIO

app = FastAPI(title="GeoDrugs AI Backend")
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("GEODRUGS_ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if origin.strip()]
AUTH_USERNAME = os.getenv("GEODRUGS_USERNAME", "admin")
AUTH_PASSWORD = os.getenv("GEODRUGS_PASSWORD", "admin123")
AUTH_TOKEN = os.getenv("GEODRUGS_AUTH_TOKEN", secrets.token_urlsafe(32))
app.add_middleware(CORSMiddleware, allow_origins=ALLOWED_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
MODEL_PATH = Path(__file__).parent / "geodrucgs_model.pkl"
try:
    model = joblib.load(MODEL_PATH)
    MODEL_STATUS = "Model loaded successfully"
except Exception as e:
    model = None
    MODEL_STATUS = f"Model not loaded: {e}"
class LoginData(BaseModel):
    username: str
    password: str
class PredictionInput(BaseModel):
    province:str
    district:str
    latitude:float=Field(ge=-90,le=90)
    longitude:float=Field(ge=-180,le=180)
    reported_incidents:float=Field(ge=0)
    historical_incident_frequency:float=Field(ge=0)
    poverty_level:float=Field(ge=0,le=100)
    unemployment_rate:float=Field(ge=0,le=100)
    crime_rate:float=Field(ge=0,le=100)
    population_density:float=Field(ge=0)
    health_service_access:float=Field(ge=0,le=100)
    urban_rural_class:str
    prior_hotspot_status:int=Field(ge=0,le=1)
    education_attainment:float=Field(ge=0,le=100)
    neighboring_district_case_density:float=Field(ge=0)
    year:int=Field(ge=2020,le=2100)
    month_number:int=Field(ge=1,le=12)
    quarter:int=Field(ge=1,le=4)
    is_holiday_season:int=Field(ge=0,le=1)
    time_index:float=Field(ge=0)
    incident_growth:float
    incident_growth_rate:float
    incidents_per_density:float=Field(ge=0)
    socioeconomic_pressure_index:float=Field(ge=0,le=100)
    service_deprivation_index:float=Field(ge=0,le=100)
    crime_density_interaction:float=Field(ge=0)
    hotspot_persistence_index:float=Field(ge=0)
    neighbor_pressure_index:float=Field(ge=0)
class FutureHotspotInput(BaseModel):
    year:int=Field(ge=2020,le=2100)
    month:str
    unemployment_rate:float=Field(ge=0,le=100)
    crime_rate:float=Field(ge=0,le=100)
    poverty_index:float=Field(ge=0,le=100)
    treatment_access:str="Low"
    school_dropout:str="No"
    urban_rural:str="Urban"
    province:str|None=None
REQUIRED_PREDICTION_COLUMNS=["province","district","latitude","longitude","reported_incidents","historical_incident_frequency","poverty_level","unemployment_rate","crime_rate","population_density","health_service_access","urban_rural_class","prior_hotspot_status","education_attainment","neighboring_district_case_density","year","month_number","quarter","is_holiday_season","time_index","incident_growth","incident_growth_rate","incidents_per_density","socioeconomic_pressure_index","service_deprivation_index","crime_density_interaction","hotspot_persistence_index","neighbor_pressure_index"]
TRAINED_DISTRICTS=["Beitbridge","Bindura","Chipinge","Chitungwiza","Gokwe","Gutu","Gweru Urban","Highfield","Hwange","Kadoma","Kwekwe","Makokoba","Marondera","Masvingo Urban","Mbare","Murehwa","Mutare CBD","Nkulumane"]
HOTSPOTS=[
 {"province":"Harare","district":"Harare Urban","lat":-17.8252,"lng":31.0335,"risk":"High","cases":420},
 {"province":"Bulawayo","district":"Bulawayo Urban","lat":-20.1325,"lng":28.6265,"risk":"High","cases":310},
 {"province":"Manicaland","district":"Mutare","lat":-18.9707,"lng":32.6709,"risk":"Medium","cases":210},
 {"province":"Midlands","district":"Gweru","lat":-19.4517,"lng":29.8170,"risk":"Medium","cases":190},
 {"province":"Masvingo","district":"Masvingo Urban","lat":-20.0744,"lng":30.8322,"risk":"Medium","cases":170},
 {"province":"Mashonaland West","district":"Chinhoyi","lat":-17.3596,"lng":30.1945,"risk":"Low","cases":90}
]
TIME_SERIES=[{"year":2021,"month":"Jan","cases":120},{"year":2021,"month":"Feb","cases":145},{"year":2021,"month":"Mar","cases":160},{"year":2022,"month":"Jan","cases":190},{"year":2022,"month":"Feb","cases":220},{"year":2023,"month":"Jan","cases":275},{"year":2024,"month":"Jan","cases":330},{"year":2026,"month":"May","cases":355}]
MONTH_NUMBERS={"jan":1,"january":1,"feb":2,"february":2,"mar":3,"march":3,"apr":4,"april":4,"may":5,"jun":6,"june":6,"jul":7,"july":7,"aug":8,"august":8,"sep":9,"sept":9,"september":9,"oct":10,"october":10,"nov":11,"november":11,"dec":12,"december":12}
def fallback_risk_score(d):
    score=min(max(d.unemployment_rate,0),100)*.25+min(max(d.crime_rate,0),100)*.25+min(max(d.poverty_level,0),100)*.2
    score+=min(max(d.reported_incidents,0),500)/500*12
    score+=min(max(d.historical_incident_frequency,0),100)/100*8
    score+=min(max(d.service_deprivation_index,0),100)*.1
    if d.prior_hotspot_status==1: score+=8
    if d.is_holiday_season==1: score+=4
    if d.urban_rural_class.lower()=="urban": score+=4
    return ("High Risk" if score>=60 else "Medium Risk" if score>=35 else "Low Risk", round(score,2))
def future_hotspot_score(area, d):
    socio_score=min(max(d.unemployment_rate,0),100)*.3+min(max(d.crime_rate,0),100)*.3+min(max(d.poverty_index,0),100)*.25
    if d.treatment_access.lower() in ["low","poor","none"]: socio_score+=8
    if d.school_dropout.lower()=="yes": socio_score+=7
    if d.urban_rural.lower()=="urban": socio_score+=4
    historical_pressure=min(area["cases"]/6,35)
    projected_score=min(socio_score+historical_pressure,100)
    return round(projected_score,2)
def risk_label(score):
    return "High" if score>=70 else "Medium" if score>=45 else "Low"
def format_prediction(value):
    labels={0:"Low Risk",1:"Medium Risk",2:"High Risk","0":"Low Risk","1":"Medium Risk","2":"High Risk"}
    return labels.get(value,str(value))
def month_number(month):
    if isinstance(month,int): return min(max(month,1),12)
    text=str(month).strip().lower()
    if text.isdigit(): return min(max(int(text),1),12)
    return MONTH_NUMBERS.get(text[:3],MONTH_NUMBERS.get(text,1))
def area_baseline(d):
    for area in HOTSPOTS:
        if area["district"].lower()==d.district.lower() or area["province"].lower()==d.province.lower():
            return area
    return {"cases":75,"risk":"Low"}
def access_score(value):
    scores={"none":5,"poor":15,"low":25,"medium":55,"high":85}
    return scores.get(str(value).strip().lower(),50)
def education_score(value):
    scores={"none":0,"primary":30,"secondary":60,"tertiary":85,"university":90}
    return scores.get(str(value).strip().lower(),50)
def prepare_model_input(d):
    model_ready=d.dict()
    expected=getattr(model,"feature_names_in_",None) if model is not None else None
    if expected is not None:
        input_dict={name:model_ready.get(name,0) for name in expected}
        return input_dict,pd.DataFrame([input_dict],columns=list(expected))
    return model_ready,pd.DataFrame([model_ready])
def require_auth(authorization: str = Header(default="")):
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not secrets.compare_digest(token, AUTH_TOKEN):
        raise HTTPException(status_code=401, detail="Authentication required")
    return True
@app.get('/')
def home(): return {"message":"GeoDrugs AI API running","model_status":MODEL_STATUS}
@app.post('/login')
def login(data:LoginData):
    if not secrets.compare_digest(data.username, AUTH_USERNAME) or not secrets.compare_digest(data.password, AUTH_PASSWORD):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    return {"success":True,"message":"Login successful","token":AUTH_TOKEN}
@app.post('/predict')
def predict(data:PredictionInput, _auth: bool = Depends(require_auth)):
    input_dict,input_df=prepare_model_input(data)
    if model is not None:
        try:
            pred=model.predict(input_df)[0]
            conf=float(max(model.predict_proba(input_df)[0])) if hasattr(model,'predict_proba') else None
            return {"prediction":format_prediction(pred),"raw_prediction":str(pred),"confidence":conf,"model_status":MODEL_STATUS,"input_variables":input_dict}
        except Exception as e:
            pred,score=fallback_risk_score(data); return {"prediction":pred,"risk_score":score,"model_status":"Model exists but prediction failed. Fallback scoring used.","error":str(e),"input_variables":input_dict}
    pred,score=fallback_risk_score(data); return {"prediction":pred,"risk_score":score,"model_status":"geodrucgs_model.pkl not found. Fallback scoring used.","input_variables":input_dict}
@app.get('/dashboard')
def dashboard(_auth: bool = Depends(require_auth)): return {"total_cases":1395,"high_risk_cases":730,"medium_risk_cases":570,"low_risk_cases":95,"provinces_monitored":10,"model_status":MODEL_STATUS,"top_hotspots":HOTSPOTS[:3]}
@app.get('/hotspots')
def hotspots(_auth: bool = Depends(require_auth)): return HOTSPOTS
@app.post('/future-hotspots')
def future_hotspots(data:FutureHotspotInput, _auth: bool = Depends(require_auth)):
    areas=[h for h in HOTSPOTS if not data.province or h["province"].lower()==data.province.lower()]
    forecasts=[]
    for area in areas:
        score=future_hotspot_score(area,data)
        forecasts.append({
            **area,
            "forecast_year":data.year,
            "forecast_month":data.month,
            "projected_risk":risk_label(score),
            "projected_score":score,
            "drivers":{
                "unemployment_rate":data.unemployment_rate,
                "crime_rate":data.crime_rate,
                "poverty_index":data.poverty_index,
                "treatment_access":data.treatment_access,
                "school_dropout":data.school_dropout,
                "urban_rural":data.urban_rural
            }
        })
    return sorted(forecasts,key=lambda x:x["projected_score"],reverse=True)
@app.get('/timeseries')
def timeseries(_auth: bool = Depends(require_auth)): return TIME_SERIES
@app.get('/variables')
def variables(_auth: bool = Depends(require_auth)): return REQUIRED_PREDICTION_COLUMNS
@app.get('/districts')
def districts(_auth: bool = Depends(require_auth)): return TRAINED_DISTRICTS
@app.post('/predict-csv')
async def predict_csv(file: UploadFile = File(...), _auth: bool = Depends(require_auth)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Upload a CSV file.")
    try:
        contents=await file.read()
        df=pd.read_csv(BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Could not read CSV file: {e}")
    missing=[col for col in REQUIRED_PREDICTION_COLUMNS if col not in df.columns]
    if missing:
        raise HTTPException(status_code=400, detail=f"Missing required columns: {', '.join(missing)}")
    results=[]
    for index,row in df.iterrows():
        raw={col:row[col] for col in REQUIRED_PREDICTION_COLUMNS}
        try:
            data=PredictionInput(**raw)
            input_dict,input_df=prepare_model_input(data)
            if model is not None:
                pred=model.predict(input_df)[0]
                conf=float(max(model.predict_proba(input_df)[0])) if hasattr(model,'predict_proba') else None
                results.append({**raw,"prediction":format_prediction(pred),"raw_prediction":str(pred),"confidence":conf,"model_status":MODEL_STATUS})
            else:
                pred,score=fallback_risk_score(data)
                results.append({**raw,"prediction":pred,"risk_score":score,"model_status":"geodrucgs_model.pkl not found. Fallback scoring used."})
        except Exception as e:
            results.append({**raw,"prediction":None,"error":str(e),"model_status":"Prediction failed for this row."})
    return {"filename":file.filename,"rows":len(results),"results":results}
@app.get('/reports')
def reports(_auth: bool = Depends(require_auth)): return {"title":"GeoDrugs AI Hotspot and Risk Report","summary":"The system combines demographic, socio-economic, criminality, treatment access and geospatial variables to predict drug abuse risk and identify hotspots.","findings":["Urban districts show higher hotspot concentration.","Higher unemployment, crime rate and poverty index increase predicted risk.","Poor treatment access and school dropout indicators increase vulnerability.","Harare and Bulawayo appear as priority intervention zones in the sample data."],"recommendations":["Prioritise awareness campaigns in high-risk urban districts.","Improve treatment and rehabilitation access in hotspot zones.","Strengthen district-level surveillance and reporting.","Use GIS hotspot maps to target police, health and social support interventions."],"hotspots":HOTSPOTS}
