import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import MainPage from "./scomponents/MainPage";

createRoot(document.getElementById("root")).render(
  <div>
    <Header />
    <MainPage />
    <Footer />
  </div>
);
