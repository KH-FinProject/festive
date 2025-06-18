import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";

createRoot(document.getElementById("root")).render(
  <div>
    <Header />
    <Footer />
  </div>
);
