import React, { useEffect } from "react";
import Routes from "./Routes";
import { cleanupImageCache } from "./utils/imageCache";

function App() {
  useEffect(() => {
    cleanupImageCache();
  }, []);

  return <Routes />;
}

export default App;
