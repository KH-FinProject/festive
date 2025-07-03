import React from "react";
import { Route, Routes } from "react-router-dom";
import MainPage from "./scomponents/mainPage/mainPage.jsx";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Signup from "./jcomponents/Signup/Signup.jsx";
import WaglePage from "./ycomponents/wagle/WaglePage.jsx";
import WritePage from "./ycomponents/wagle/WritePage.jsx";
import EditPage from "./ycomponents/wagle/EditPage.jsx";
import Find from "./jcomponents/Find/Find.jsx";
import FestivalMainPage from "./scomponents/monthFestive/This-month-festive.jsx";
import WagleDetail from "./ycomponents/wagle/WagleDetail.jsx";
import FestiveCalendar from "./kcomponents/festiveCalendar/FestiveCalendar.jsx";
import MyPageEditProfile from "./kcomponents/myPage/MyPageEditProfile.jsx";
import MyPageEditInfo from "./kcomponents/myPage/MyPageEditInfo.jsx";
import MyPageEditPw from "./kcomponents/myPage/MyPageEditPw.jsx";
import MyPageCalendar from "./kcomponents/myPage/MyPageCalendar.jsx";
import MyPageMyPost from "./kcomponents/myPage/MyPageMyPost.jsx";
import MyPageMyComment from "./kcomponents/myPage/MyPageMyComment.jsx";
import MyPageWithdrawal from "./kcomponents/myPage/MyPageWithdrawal.jsx";
import AITravelCourse from "./ycomponents/aitravel/AITravelCourse.jsx";
import AIChatbot from "./ycomponents/aitravel/AIChatbot.jsx";
import TravelCourseDetail from "./ycomponents/aitravel/TravelCourseDetail.jsx";
import AdminRoutes from "./mcomponents/Admin.jsx";
import Booth from "./scomponents/booth/Booth.jsx";
import LocalFestive from "./jcomponents/LocalFestive/LocalFestive.jsx";
import FestivalDetail from "./mcomponents/FestivalDetail";
import CustomerCenter from "./ycomponents/customerCenter/CustomerCenter.jsx";
import CustomerWrite from "./ycomponents/customerCenter/CustomerWrite.jsx";
import CustomerEdit from "./ycomponents/customerCenter/CustomerEdit.jsx";
import CustomerDetail from "./ycomponents/customerCenter/CustomerDetail.jsx";

const AppRoutes = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/find" element={<Find />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/festival/local" element={<LocalFestive />} />
        <Route path="/wagle" element={<WaglePage />} />
        <Route path="/wagle/write" element={<WritePage />} />
        <Route path="/wagle/edit/:id" element={<EditPage />} />
        <Route path="/wagle/:id" element={<WagleDetail />} />
        <Route path="/this-month" element={<FestivalMainPage />} />
        <Route path="/ai-travel" element={<AITravelCourse />} />
        <Route path="/ai-travel/chat" element={<AIChatbot />} />
        <Route path="/course/:courseId" element={<TravelCourseDetail />} />
        <Route path="/calendar" element={<FestiveCalendar />} />
        <Route path="/mypage/profile" element={<MyPageEditProfile />} />
        <Route path="/mypage/info" element={<MyPageEditInfo />} />
        <Route path="/mypage/pw" element={<MyPageEditPw />} />
        <Route path="/mypage/mycalendar" element={<MyPageCalendar />} />
        <Route path="/mypage/mypost" element={<MyPageMyPost />} />
        <Route path="/mypage/mycomment" element={<MyPageMyComment />} />
        <Route path="/mypage/withdrawal" element={<MyPageWithdrawal />} />
        <Route path="/booth" element={<Booth />} />
        <Route path="/admin/*" element={<AdminRoutes />} />
        <Route
          path="/festival/detail/:contentId"
          element={<FestivalDetail />}
        />
        <Route path="/customer-center" element={<CustomerCenter />} />
        <Route path="/customer-center/write" element={<CustomerWrite />} />
        <Route path="/customer-center/edit/:id" element={<CustomerEdit />} />
        <Route path="/customer-center/:id" element={<CustomerDetail />} />
      </Routes>
    </>
  );
};

export default AppRoutes;
