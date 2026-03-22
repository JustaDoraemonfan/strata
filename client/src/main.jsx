import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { injectStore } from "./api/axios";
import { useAuthStore } from "./store/authStore";

injectStore(() => useAuthStore.getState());

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
