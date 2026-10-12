import React, { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { Providers } from "./app/providers";
import { initializeAppSettings } from "./utils/dateUtils";

export const App: React.FC = () => {
  useEffect(() => {
    initializeAppSettings();
  }, []);

  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
};

export default App;
