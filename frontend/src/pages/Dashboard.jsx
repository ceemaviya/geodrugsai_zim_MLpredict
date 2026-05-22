import React, { useEffect, useMemo, useState } from "react";
import API from "../services/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

const featureGroups = {
  Location: ["province", "district", "latitude", "longitude", "urban_rural_class", "population_density"],
  Incidents: ["reported_incidents", "historical_incident_frequency", "incident_growth", "incident_growth_rate", "incidents_per_density"],
  "Socio-economic": ["poverty_level", "unemployment_rate", "education_attainment", "socioeconomic_pressure_index"],
  "Health and crime": ["crime_rate", "health_service_access", "service_deprivation_index", "crime_density_interaction"],
  "Hotspot context": ["prior_hotspot_status", "neighboring_district_case_density", "hotspot_persistence_index", "neighbor_pressure_index"],
  Time: ["year", "month_number", "quarter", "is_holiday_season", "time_index"]
};

const riskColors = {
  High: "#dc2626",
  Medium: "#f59e0b",
  Low: "#16a34a"
};

function Dashboard() {
  const [data, setData] = useState({ top_hotspots: [] });
  const [variables, setVariables] = useState([]);
  const [timeseries, setTimeseries] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("Location");

  useEffect(() => {
    API.get("/dashboard").then((r) => setData(r.data));
    API.get("/variables").then((r) => setVariables(r.data));
    API.get("/timeseries").then((r) => setTimeseries(r.data));
  }, []);

  const riskData = useMemo(
    () => [
      { name: "High", value: data.high_risk_cases || 0 },
      { name: "Medium", value: data.medium_risk_cases || 0 },
      { name: "Low", value: data.low_risk_cases || 0 }
    ],
    [data]
  );

  const visibleFeatures = featureGroups[selectedGroup].filter((feature) => variables.includes(feature));

  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Drug abuse risk monitoring, model status, hotspot ranking and prediction feature coverage.</p>
        </div>
        <div className="status-pill">{data.model_status || "Checking model status"}</div>
      </div>

      <div className="cards dashboard-kpis">
        <div className="card metric-card">
          <span>Total Cases</span>
          <p>{data.total_cases || 0}</p>
        </div>
        <div className="card metric-card danger">
          <span>High Risk</span>
          <p>{data.high_risk_cases || 0}</p>
        </div>
        <div className="card metric-card warning">
          <span>Medium Risk</span>
          <p>{data.medium_risk_cases || 0}</p>
        </div>
        <div className="card metric-card success">
          <span>Provinces</span>
          <p>{data.provinces_monitored || 0}</p>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel chart-panel">
          <h2>Risk Distribution</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={riskData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {riskData.map((entry) => (
                  <Cell key={entry.name} fill={riskColors[entry.name]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="panel chart-panel">
          <h2>Case Trend</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={timeseries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cases" stroke="#0f766e" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="panel">
          <div className="panel-title-row">
            <h2>Prediction Features</h2>
            <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)}>
              {Object.keys(featureGroups).map((group) => (
                <option key={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="feature-list">
            {visibleFeatures.map((feature) => (
              <div className="feature-item" key={feature}>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>Top Hotspots</h2>
          <table>
            <thead>
              <tr>
                <th>Province</th>
                <th>District</th>
                <th>Risk</th>
                <th>Cases</th>
              </tr>
            </thead>
            <tbody>
              {data.top_hotspots.map((h, i) => (
                <tr key={i}>
                  <td>{h.province}</td>
                  <td>{h.district}</td>
                  <td>
                    <span className={`risk-badge ${h.risk.toLowerCase()}`}>{h.risk}</span>
                  </td>
                  <td>{h.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
