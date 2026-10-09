import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { Providers } from "./app/providers";
import {
  applyThemeMode,
  applyFontSize,
  applyDensityMode,
} from "./utils/dateUtils";

export const App: React.FC = () => {
  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("careflow_theme") as any) || "light";
    const savedFontSize =
      (localStorage.getItem("careflow_fontSize") as any) || "medium";
    const savedDensity =
      (localStorage.getItem("careflow_density") as any) || "comfortable";
    applyThemeMode(savedTheme);
    applyFontSize(savedFontSize);
    applyDensityMode(savedDensity);
  }, []);

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
