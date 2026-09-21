// src/App.tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Overlay from "./pages/Overlay";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/overlay" element={<Overlay />} />
        <Route path="*" element={<p>Ruta no encontrada</p>} />
      </Routes>
    </BrowserRouter>
  );
}