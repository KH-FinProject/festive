import React from "react";
import { Route, Routes } from "react-router-dom";
import MainPage from "./scomponents/mainPage/mainPage.jsx";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Signup from "./jcomponents/Signup/Signup.jsx";
import WaglePage from "./ycomponents/WaglePage.jsx";
import WritePage from "./ycomponents/WritePage.jsx";
import Find from "./jcomponents/FindId/Find.jsx";
import FestivalMainPage from "./scomponents/monthFestive/This-month-festive.jsx";
import WagleDetail from "./ycomponents/WagleDetail.jsx";
import FestiveCalendar from "./kcomponents/festiveCalendar/FestiveCalendar.jsx";
import MyPageEditProfile from "./kcomponents/myPage/MyPageEditProfile.jsx";
import MyPageEditInfo from "./kcomponents/myPage/MyPageEditInfo.jsx";
import MyPageEditPw from "./kcomponents/myPage/MyPageEditPw.jsx";
import MyPageCalendar from "./kcomponents/myPage/MyPageCalendar.jsx";
import MyPageMyPost from "./kcomponents/myPage/MyPageMyPost.jsx";
import MyPageMyComment from "./kcomponents/myPage/MyPageMyComment.jsx";
import MyPageWithdrawal from "./kcomponents/myPage/MyPageWithdrawal.jsx";
import AITravelCourse from "./ycomponents/aitravel/AITravelCourse.jsx";
// import AIChatbot from "./ycomponents/aitravel/AIChatbot";

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
      <Route path="/ai-travel" element={<AITravelCourse />} />
      {/* <Route path="/ai-travel/chat" element={<AIChatbot />} /> */}
      <Route path="/calendar" element={<FestiveCalendar />} />
      <Route path="/mypage/profile" element={<MyPageEditProfile />} />
      <Route path="/mypage/info" element={<MyPageEditInfo />} />
      <Route path="/mypage/pw" element={<MyPageEditPw />} />
      <Route path="/mypage/mycalendar" element={<MyPageCalendar />} />
      <Route path="/mypage/mypost" element={<MyPageMyPost />} />
      <Route path="/mypage/mycomment" element={<MyPageMyComment />} />
      <Route path="/mypage/withdrawal" element={<MyPageWithdrawal />} />
    </Routes>
  );
};

export default AppRoutes;
