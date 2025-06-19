import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Header from "./components/Header.jsx";
import MainPage from "./scomponents/mainPage/MainPage.jsx";
import Footer from "./components/Footer.jsx";
import SignUp1 from "./jcomponents/Signup/Signup1.jsx";

import WaglePage from "./ycomponents/WaglePage.jsx";
import WritePage from "./ycomponents/WritePage.jsx";
import MyPageEditPw from "./kcomponents/MyPageEditPw.jsx";
import WagleDetail from "./ycomponents/WagleDetail.jsx";
import FestivalMainPage from "./scomponents/monthFestive/This-month-festive.jsx";

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
        <Route path="/wagle/:id" element={<WagleDetail />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;
