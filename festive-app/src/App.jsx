import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WaglePage from "./wagle/WaglePage";
import WritePage from "./wagle/WritePage";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
        <Route path="*" element={<Navigate to="/wagle" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
