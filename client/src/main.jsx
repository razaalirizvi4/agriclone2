import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./app/store"; // ✅ note the default import
import CorePage from "./components/CorePage";
import Home from "./pages/Home";
import About from "./pages/About";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EventStreamPage from "./pages/EventStreamPage";
import LocationPage from "./pages/LocationPage";
import WizardPage from "./pages/WizardPage";
import RecipeWizard from "./pages/RecipeWizard";
import FarmDrawPage from "./pages/FarmDrawPage";
import FieldsPage from "./pages/FieldsPage";
import ReviewPage from "./pages/ReviewPage";
import ProtectedRoute from "./router/ProtectedRoute";
import PublicRoute from "./router/PublicRoute";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import "./App.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <Provider store={store}>
      {" "}
      {/* ✅ wraps entire app */}
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={4000}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          pauseOnHover
          draggable
          theme="colored"
        />
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<CorePage />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="event-stream" element={<EventStreamPage />} />
              <Route path="locations" element={<LocationPage />} />
              <Route path="wizard" element={<WizardPage />}>
                <Route index element={<FarmDrawPage />} />{" "}
                {/* Default: wizard/FarmDraw */}
                <Route path="fields" element={<FieldsPage />} />
                <Route path="review" element={<ReviewPage />} />
              </Route>
              <Route path="recipe-wizard" element={<RecipeWizard />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
