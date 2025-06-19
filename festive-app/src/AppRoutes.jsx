import {Route, Routes} from "react-router-dom";
import MainPage from "./scomponents/mainPage.jsx";
import Signin from "./jcomponents/Signin/Signin.jsx";
import SignUp1 from "./jcomponents/Signup/Signup1.jsx";
import WaglePage from "./wagle/WaglePage.jsx";
import WritePage from "./wagle/WritePage.jsx";
import Find from "./jcomponents/FindId/Find.jsx";
import FestivalMainPage from "./scomponents/monthFestive/This-month-festive.jsx";
import WagleDetail from "./ycomponents/WagleDetail.jsx";

const AppRoutes = () => {
  return (
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/find" element={<Find />} />
        <Route path="/signup" element={<SignUp1 />} />
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
        <Route path="/wagle/:id" element={<WagleDetail />} />
        <Route path="/this-month" element={<FestivalMainPage />} />
      </Routes>
  );
}

export default AppRoutes;