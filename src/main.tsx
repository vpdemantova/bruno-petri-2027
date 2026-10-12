import "@fontsource/syne/400.css";
import "@fontsource/syne/500.css";
import "@fontsource/syne/600.css";
import "@fontsource/lexend/600.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "./styles/app.css";
import { createRoot } from "react-dom/client";
import App from "./app/App";

// sem StrictMode: o efeito duplo do modo de desenvolvimento faria cada vista 3D "voar" dela para ela mesma
createRoot(document.getElementById("root")!).render(<App />);
