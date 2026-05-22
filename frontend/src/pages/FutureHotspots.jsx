import React, { useState } from "react";
import API from "../services/api";

const initialForm = {
  year: 2027,
  month: "Jan",
  unemployment_rate: 48,
  crime_rate: 62,
  poverty_index: 58,
  treatment_access: "Low",
  school_dropout: "No",
  urban_rural: "Urban",
  province: ""
};

function FutureHotspots() {
  const [form, setForm] = useState(initialForm);
  const [forecasts, setForecasts] = useState([]);
  const [error, setError] = useState("");

  const change = (e) => {
    const { name, value } = e.target;
    const numeric = ["year", "unemployment_rate", "crime_rate", "poverty_index"];
    setForm({ ...form, [name]: numeric.includes(name) ? Number(value) : value });
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form, province: form.province || null };
      const res = await API.post("/future-hotspots", payload);
      setForecasts(res.data);
    } catch {
      setError("Could not generate hotspot forecast. Check that the backend is running.");
    }
  };

  return (
    <div>
      <h1>Future Hotspots</h1>
      <p>Forecast future hotspot areas using projected socio-economic conditions.</p>

      <form className="grid-form" onSubmit={submit}>
        <input name="year" type="number" value={form.year} onChange={change} placeholder="Forecast Year" />
        <input name="month" value={form.month} onChange={change} placeholder="Forecast Month" />
        <input name="unemployment_rate" type="number" value={form.unemployment_rate} onChange={change} placeholder="Unemployment Rate" />
        <input name="crime_rate" type="number" value={form.crime_rate} onChange={change} placeholder="Crime Rate" />
        <input name="poverty_index" type="number" value={form.poverty_index} onChange={change} placeholder="Poverty Index" />
        <select name="treatment_access" value={form.treatment_access} onChange={change}>
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
          <option>Poor</option>
          <option>None</option>
        </select>
        <select name="school_dropout" value={form.school_dropout} onChange={change}>
          <option>No</option>
          <option>Yes</option>
        </select>
        <select name="urban_rural" value={form.urban_rural} onChange={change}>
          <option>Urban</option>
          <option>Rural</option>
        </select>
        <select name="province" value={form.province} onChange={change}>
          <option value="">All Provinces</option>
          <option>Harare</option>
          <option>Bulawayo</option>
          <option>Manicaland</option>
          <option>Masvingo</option>
          <option>Midlands</option>
          <option>Mashonaland West</option>
        </select>
        <button type="submit">Forecast Hotspots</button>
      </form>

      {error && <p className="error">{error}</p>}

      {forecasts.length > 0 && (
        <div className="panel">
          <h2>Ranked Forecast</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Province</th>
                <th>District</th>
                <th>Projected Risk</th>
                <th>Score</th>
                <th>Baseline Cases</th>
              </tr>
            </thead>
            <tbody>
              {forecasts.map((h, i) => (
                <tr key={`${h.district}-${i}`}>
                  <td>{i + 1}</td>
                  <td>{h.province}</td>
                  <td>{h.district}</td>
                  <td>{h.projected_risk}</td>
                  <td>{h.projected_score}</td>
                  <td>{h.cases}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default FutureHotspots;
