import React, { useState } from "react";
import API from "../services/api";

const allVariables = [
  "province", "district", "latitude", "longitude", "reported_incidents",
  "historical_incident_frequency", "poverty_level", "unemployment_rate",
  "crime_rate", "population_density", "health_service_access",
  "urban_rural_class", "prior_hotspot_status", "education_attainment",
  "neighboring_district_case_density", "year", "month_number", "quarter",
  "is_holiday_season", "time_index", "incident_growth", "incident_growth_rate",
  "incidents_per_density", "socioeconomic_pressure_index",
  "service_deprivation_index", "crime_density_interaction",
  "hotspot_persistence_index", "neighbor_pressure_index"
];

const featureGroups = {
  Location: ["province", "district", "latitude", "longitude", "urban_rural_class", "population_density"],
  Incidents: ["reported_incidents", "historical_incident_frequency", "incident_growth", "incident_growth_rate", "incidents_per_density"],
  "Socio-economic": ["poverty_level", "unemployment_rate", "education_attainment", "socioeconomic_pressure_index"],
  "Health and crime": ["crime_rate", "health_service_access", "service_deprivation_index", "crime_density_interaction"],
  "Hotspot context": ["prior_hotspot_status", "neighboring_district_case_density", "hotspot_persistence_index", "neighbor_pressure_index"],
  Time: ["year", "month_number", "quarter", "is_holiday_season", "time_index"],
  "All features": allVariables
};

const districtOptions = [
  "Beitbridge",
  "Bindura",
  "Chipinge",
  "Chitungwiza",
  "Gokwe",
  "Gutu",
  "Gweru Urban",
  "Highfield",
  "Hwange",
  "Kadoma",
  "Kwekwe",
  "Makokoba",
  "Marondera",
  "Masvingo Urban",
  "Mbare",
  "Murehwa",
  "Mutare CBD",
  "Nkulumane"
];

const initialForm = {
  province: "Harare",
  district: "Mbare",
  latitude: -17.8252,
  longitude: 31.0335,
  reported_incidents: 420,
  historical_incident_frequency: 35,
  poverty_level: 55,
  unemployment_rate: 45,
  crime_rate: 60,
  population_density: 3500,
  health_service_access: 25,
  urban_rural_class: "Urban",
  prior_hotspot_status: 1,
  education_attainment: 60,
  neighboring_district_case_density: 42,
  year: 2026,
  month_number: 5,
  quarter: 2,
  is_holiday_season: 0,
  time_index: 77,
  incident_growth: 2.8,
  incident_growth_rate: 8,
  incidents_per_density: 120,
  socioeconomic_pressure_index: 53.33,
  service_deprivation_index: 75,
  crime_density_interaction: 2.1,
  hotspot_persistence_index: 35,
  neighbor_pressure_index: 42
};

const numericFields = allVariables.filter((field) => !["province", "district", "urban_rural_class"].includes(field));

function Prediction() {
  const [form, setForm] = useState(initialForm);
  const [selectedGroup, setSelectedGroup] = useState("Location");
  const [selectedVariables, setSelectedVariables] = useState(featureGroups.Location);
  const [showSelector, setShowSelector] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [csvFile, setCsvFile] = useState(null);
  const [csvResult, setCsvResult] = useState(null);
  const [csvError, setCsvError] = useState("");

  const change = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: numericFields.includes(name) ? Number(value) : value });
  };

  const toggleVariable = (variable) => {
    setSelectedGroup("Custom");
    setSelectedVariables((current) =>
      current.includes(variable) ? current.filter((v) => v !== variable) : [...current, variable]
    );
  };

  const changeFeatureGroup = (group) => {
    setSelectedGroup(group);
    setSelectedVariables(featureGroups[group] || selectedVariables);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setResult(null);

    const missing = allVariables.filter((variable) => form[variable] === "" || form[variable] === null || form[variable] === undefined);
    if (missing.length > 0) {
      setError(`Missing required prediction fields: ${missing.join(", ")}`);
      return;
    }

    try {
      const res = await API.post("/predict", form);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Prediction failed. Check your input values and backend connection.");
    }
  };

  const renderInput = (name) => {
    if (!selectedVariables.includes(name)) return null;

    if (name === "province") {
      return (
        <select name="province" value={form.province} onChange={change}>
          <option>Harare</option>
          <option>Bulawayo</option>
          <option>Manicaland</option>
          <option>Masvingo</option>
          <option>Midlands</option>
          <option>Mashonaland East</option>
          <option>Mashonaland West</option>
          <option>Mashonaland Central</option>
          <option>Matabeleland North</option>
          <option>Matabeleland South</option>
        </select>
      );
    }

    if (name === "district") {
      return (
        <select name="district" value={form.district} onChange={change}>
          {districtOptions.map((district) => (
            <option key={district}>{district}</option>
          ))}
        </select>
      );
    }

    if (name === "urban_rural_class") {
      return (
        <select name="urban_rural_class" value={form.urban_rural_class} onChange={change}>
          <option>Urban</option>
          <option>Rural</option>
        </select>
      );
    }

    if (name === "prior_hotspot_status" || name === "is_holiday_season") {
      return (
        <select name={name} value={form[name]} onChange={change}>
          <option value={0}>No / 0</option>
          <option value={1}>Yes / 1</option>
        </select>
      );
    }

    return (
      <input
        name={name}
        value={form[name]}
        onChange={change}
        placeholder={name}
        type={numericFields.includes(name) ? "number" : "text"}
        step={numericFields.includes(name) ? "any" : undefined}
      />
    );
  };

  const uploadCsv = async (e) => {
    e.preventDefault();
    setCsvError("");
    setCsvResult(null);
    if (!csvFile) {
      setCsvError("Choose a CSV file first.");
      return;
    }
    const payload = new FormData();
    payload.append("file", csvFile);
    try {
      const res = await API.post("/predict-csv", payload, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCsvResult(res.data);
    } catch (err) {
      setCsvError(err.response?.data?.detail || "CSV prediction failed. Check the file columns and backend connection.");
    }
  };

  const downloadCsvResults = () => {
    if (!csvResult?.results?.length) return;
    const columns = Object.keys(csvResult.results[0]);
    const escape = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;
    const rows = [
      columns.join(","),
      ...csvResult.results.map((row) => columns.map((column) => escape(row[column])).join(","))
    ];
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "geodrugs_predictions.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h1>Prediction</h1>
      <p>Use the exact features the model was trained on.</p>

      <div className="panel prediction-features-panel">
        <div className="panel-title-row">
          <h2>Prediction Features</h2>
          <select value={selectedGroup} onChange={(e) => changeFeatureGroup(e.target.value)}>
            {Object.keys(featureGroups).map((group) => (
              <option key={group}>{group}</option>
            ))}
            {selectedGroup === "Custom" && <option>Custom</option>}
          </select>
        </div>

        <div className="feature-list">
          {(featureGroups[selectedGroup] || allVariables).map((feature) => (
            <div
              className={`feature-item clickable ${selectedVariables.includes(feature) ? "selected" : ""}`}
              key={feature}
              onClick={() => toggleVariable(feature)}
            >
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      <button type="button" onClick={() => setShowSelector(!showSelector)}>
        Customize Visible Variables
      </button>

      {showSelector && (
        <div className="panel">
          <h3>All Trained Model Features</h3>
          <div className="checkbox-grid">
            {allVariables.map((variable) => (
              <label key={variable}>
                <input
                  type="checkbox"
                  checked={selectedVariables.includes(variable)}
                  onChange={() => toggleVariable(variable)}
                />
                {variable}
              </label>
            ))}
          </div>
        </div>
      )}

      <form className="grid-form" onSubmit={submit}>
        {allVariables.map((variable) => (
          <div key={variable}>
            {selectedVariables.includes(variable) && <label className="field-label">{variable}</label>}
            {renderInput(variable)}
          </div>
        ))}
        <button type="submit">Predict Risk</button>
      </form>

      {error && <p className="error">{error}</p>}

      {result && (
        <div className="result-box">
          <h2>Prediction Result: {result.prediction}</h2>
          {result.confidence !== null && result.confidence !== undefined && <p>Confidence: {(result.confidence * 100).toFixed(1)}%</p>}
          {result.risk_score !== null && result.risk_score !== undefined && <p>Risk Score: {result.risk_score}</p>}
          <p>{result.model_status}</p>
        </div>
      )}

      <div className="panel">
        <h2>CSV Batch Prediction</h2>
        <p>Upload a CSV with the trained model columns to score multiple records at once.</p>
        <form onSubmit={uploadCsv}>
          <input type="file" accept=".csv" onChange={(e) => setCsvFile(e.target.files?.[0] || null)} />
          <button type="submit">Upload CSV</button>
        </form>
        {csvError && <p className="error">{csvError}</p>}
        {csvResult && (
          <div>
            <h3>{csvResult.rows} Rows Predicted</h3>
            <button type="button" onClick={downloadCsvResults}>Download Results</button>
            <table>
              <thead>
                <tr>
                  <th>Province</th>
                  <th>District</th>
                  <th>Prediction</th>
                  <th>Confidence</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {csvResult.results.slice(0, 10).map((row, i) => (
                  <tr key={i}>
                    <td>{row.province}</td>
                    <td>{row.district}</td>
                    <td>{row.prediction || row.error}</td>
                    <td>{row.confidence !== null && row.confidence !== undefined ? `${(row.confidence * 100).toFixed(1)}%` : ""}</td>
                    <td>{row.model_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Prediction;
