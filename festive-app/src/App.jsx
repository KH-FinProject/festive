import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Header from "./components/Header.jsx";
import MainPage from "./scomponents/mainPage/MainPage.jsx";
import Footer from "./components/Footer.jsx";
import SignUp1 from "./jcomponents/Signup/Signup1.jsx";
<<<<<<< HEAD
import WaglePage from "./wagle/WaglePage";
import WritePage from "./wagle/WritePage";
=======
import WaglePage from "./ycomponents/WaglePage.jsx";
import WritePage from "./ycomponents/WritePage.jsx";
import MyPageEditPw from "./kcomponents/MyPageEditPw.jsx";
import FestivalMainPage from "./scomponents/monthFestive/This-month-festive.jsx";
>>>>>>> f6fb0199ac69fbd49332fb1269f6a06de9b8d5ab

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<SignUp1 />} />
        <Route path="/this-month" element={<FestivalMainPage />} />
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
        <Route path="*" element={<Navigate to="/wagle" replace />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
