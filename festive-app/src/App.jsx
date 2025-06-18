import {BrowserRouter, Route, Routes} from "react-router-dom";
import Signin from "./jcomponents/Signin/Signin.jsx";
import Header from "./components/Header.jsx";
import Footer from "./components/Footer.jsx";
import SignUp1 from "./jcomponents/Signup/Signup1.jsx";

function App() {

  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<SignUp1 />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
