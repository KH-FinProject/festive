import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header.jsx";
import AppRoutes from "./AppRoutes.jsx";
import Footer from "./components/Footer.jsx";
import useAuth from "./hooks/useAuth.js";

function AppContent() {
  useAuth(); // 인증 로직 실행

  return (
    <>
      <Header />
      <AppRoutes />
      <Footer />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;
