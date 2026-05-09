import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ActivityPage from "./pages/ActivityPage";
import AdminPage from "./pages/AdminPage";
import AudiencePage from "./pages/AudiencePage";
import CorrectionPage from "./pages/CorrectionPage";
import HomePage from "./pages/HomePage";
import SubmitActivityPage from "./pages/SubmitActivityPage";
import AboutPage from "./pages/AboutPage";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/audience/:audience" element={<AudiencePage />} />
        <Route path="/activities/:slug" element={<ActivityPage />} />
        <Route path="/submit" element={<SubmitActivityPage />} />
        <Route path="/correct/:slug" element={<CorrectionPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
