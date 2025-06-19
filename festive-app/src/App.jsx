import { BrowserRouter } from "react-router-dom";
import Header from "./components/Header.jsx";
import AppRoutes from "./AppRoutes.jsx";
import Footer from "./components/Footer.jsx";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <AppRoutes />
      <Footer />
    </BrowserRouter>
  );
}

export default App;
