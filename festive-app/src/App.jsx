import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Header from "./components/Header.jsx";
import MainPage from "./scomponents/MainPage";
import Footer from "./components/Footer.jsx";
import SignUp1 from "./jcomponents/Signup/Signup1.jsx";
import WaglePage from "./wagle/WaglePage";
import WritePage from "./wagle/WritePage";
import MyPageEditPw from "./kcomponents/MyPageEditPw.jsx";

function App() {


  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<SignUp1 />} />
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
        <Route path="*" element={<Navigate to="/wagle" replace />} />
      </Routes>
      <MainPage />
      <Footer />
    </BrowserRouter>
  )
}

export default App;
