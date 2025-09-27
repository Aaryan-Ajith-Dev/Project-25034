// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import app from "./styles/App.module.css";
import Form from "./components/Form.jsx";
import JobListings from "./components/JobListings.jsx";
import Login from "./components/Login";
import YouthRegistration from "./components/YouthRegistration";
import AppliedJobs from "./components/AppliedJobs.jsx";

export default function App() {
  return (
    <BrowserRouter>
      <div className={app.page}>
        <Navbar />
        <Routes>
          <Route path="/" element={<Form />} />
          <Route path="/job-listings" element={<JobListings />} />
          <Route path="/login" element={<Login />} />
          <Route path="/youth-registration" element={<YouthRegistration />} />  
          <Route path="/applied-jobs" element={<AppliedJobs />} />  
        </Routes>
      </div>
    </BrowserRouter>
  );
}