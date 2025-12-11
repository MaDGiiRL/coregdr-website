// src/main.jsx
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./main.css";
import { AuthProvider } from "./context/AuthContext";
import Routing from "./routes/Routing";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <Routing />
    </AuthProvider>
  </BrowserRouter>
);
