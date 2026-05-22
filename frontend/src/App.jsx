import React from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Prediction from "./pages/Prediction.jsx";
import HotspotMap from "./pages/HotspotMap.jsx";
import FutureHotspots from "./pages/FutureHotspots.jsx";
import TimeSeries from "./pages/TimeSeries.jsx";
import Reports from "./pages/Reports.jsx";
import Variables from "./pages/Variables.jsx";

function ProtectedRoute() {
  return localStorage.getItem("geodrugs_token") ? <Outlet /> : <Navigate to="/" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/prediction" element={<Prediction />} />
            <Route path="/hotspots" element={<HotspotMap />} />
            <Route path="/future-hotspots" element={<FutureHotspots />} />
            <Route path="/timeseries" element={<TimeSeries />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/variables" element={<Variables />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
