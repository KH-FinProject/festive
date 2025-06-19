import {Route, Routes} from "react-router-dom";
import MainPage from "./scomponents/mainPage.jsx";
import Signin from "./jcomponents/Signin/Signin.jsx";
import SignUp1 from "./jcomponents/Signup/Signup1.jsx";
import WaglePage from "./wagle/WaglePage.jsx";
import WritePage from "./wagle/WritePage.jsx";
import Find from "./jcomponents/FindId/Find.jsx";

const AppRoutes = () => {
  return (
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/find" element={<Find />} />
        <Route path="/signup" element={<SignUp1 />} />
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
      </Routes>
  );
}

export default AppRoutes;