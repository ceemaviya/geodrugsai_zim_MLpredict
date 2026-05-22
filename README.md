# GeoDrugs AI Full Stack System with Maps and Reports

Predict hotspot areas for drug abuse in selected provinces in Zimbabwe using ML.

Includes FastAPI backend, React frontend, login, dashboard, prediction using trained model variables, hotspot map, time series charts, reports, variables page and logout.
Also includes future hotspot forecasting using projected socio-economic factors such as unemployment rate, crime rate, poverty index, treatment access, school dropout and urban/rural setting.

## Backend
cd backend
python -m pip install -r requirements.txt
python -m uvicorn main:app --reload

Put your model file here: backend/geodrucgs_model.pkl

Default login:
- Username: `admin`
- Password: `admin123`

For local configuration, set these environment variables before starting the backend:
- `GEODRUGS_USERNAME`
- `GEODRUGS_PASSWORD`
- `GEODRUGS_AUTH_TOKEN`
- `GEODRUGS_ALLOWED_ORIGINS`

## Frontend
cd frontend
npm install
npm run dev

Open http://localhost:5173

Set `VITE_API_URL` if your backend is not running at `http://127.0.0.1:8000`.

If prediction says model not loaded, copy geodrucgs_model.pkl into the backend folder.

## Future hotspot forecasting
Use the frontend page: `/future-hotspots`

Backend endpoint:
POST `http://127.0.0.1:8000/future-hotspots`

## CSV batch prediction
Use the Prediction page and upload a `.csv` file.

Required columns:
`province, district, latitude, longitude, reported_incidents, historical_incident_frequency, poverty_level, unemployment_rate, crime_rate, population_density, health_service_access, urban_rural_class, prior_hotspot_status, education_attainment, neighboring_district_case_density, year, month_number, quarter, is_holiday_season, time_index, incident_growth, incident_growth_rate, incidents_per_density, socioeconomic_pressure_index, service_deprivation_index, crime_density_interaction, hotspot_persistence_index, neighbor_pressure_index`

Example file:
`sample_predictions.csv`

Backend endpoint:
POST `http://127.0.0.1:8000/predict-csv`

Trained district options:
`Beitbridge, Bindura, Chipinge, Chitungwiza, Gokwe, Gutu, Gweru Urban, Highfield, Hwange, Kadoma, Kwekwe, Makokoba, Marondera, Masvingo Urban, Mbare, Murehwa, Mutare CBD, Nkulumane`
