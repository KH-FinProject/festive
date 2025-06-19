import {Route, Routes} from "react-router-dom";
import MainPage from "./scomponents/mainPage/mainPage.jsx";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Signup from "./jcomponents/Signup/Signup.jsx";
import WaglePage from "./ycomponents/WaglePage.jsx";
import WritePage from "./ycomponents/WritePage.jsx";
import Find from "./jcomponents/FindId/Find.jsx";
import FestivalMainPage from "./scomponents/monthFestive/This-month-festive.jsx";
import WagleDetail from "./ycomponents/WagleDetail.jsx";

const AppRoutes = () => {
  return (
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/find" element={<Find />} />
        <Route path="/signup/agreement" element={<Signup />} />
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
        <Route path="/wagle/:id" element={<WagleDetail />} />
        <Route path="/this-month" element={<FestivalMainPage />} />
      </Routes>
  );
}

export default AppRoutes;