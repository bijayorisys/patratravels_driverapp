import React, { useState, useEffect, useRef, useCallback } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { Toaster, toast } from "sonner";
import AppRoutes from "./routes/AppRoutes";
import Loader from "./components/Loader";
import { socket } from "./socket";

function App() {
  const [appInitializing, setAppInitializing] = useState(() => {
    return !sessionStorage.getItem("appInitialized");
  });

  // --- 1. DEFINING GPS WATCHER ---
  const watchIdRef = useRef(null);

  const startLocationWatch = useCallback(async () => {
    if (!("geolocation" in navigator)) {
      toast.error("Location not supported on this device");
      return;
    }

    // 🔹 STEP 1: CHECK PERMISSION STATE
    if (navigator.permissions) {
      try {
        const status = await navigator.permissions.query({
          name: "geolocation",
        });

        if (status.state === "denied") {
          toast.error(
            "Location permission denied. Enable it from browser settings."
          );
          return;
        }
      } catch (e) {
        console.warn("Permission check failed");
      }
    }

    // 🔹 STEP 2: FORCE PERMISSION PROMPT (IMPORTANT)
    navigator.geolocation.getCurrentPosition(
      () => {
        // Permission granted → start watching
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }

        watchIdRef.current = navigator.geolocation.watchPosition(
          () => {
            toast.dismiss("gps-error");
          },
          (err) => {
            let msg = "Location error.";

            if (err.code === 1)
              msg = "Please allow Location Permission.";
            if (err.code === 2)
              msg = "Location is OFF. Turn it ON in phone settings.";

            toast.error(msg, {
              id: "gps-error",
              duration: 3000,
            });
          },
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0,
          }
        );
      },
      (err) => {
        let msg = "Location error.";

        if (err.code === 1)
          msg = "Please allow Location Permission.";
        if (err.code === 2)
          msg = "Location is OFF. Turn it ON in phone settings.";

        toast.error(msg, {
          id: "gps-error",
          duration: 4000,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }, []);

  // --- 2. SPLASH SCREEN LOGIC ---
  useEffect(() => {
    if (!appInitializing) return;

    const timer = setTimeout(() => {
      sessionStorage.setItem("appInitialized", "true");
      setAppInitializing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [appInitializing]);

  // --- 3. MAIN SOCKET & GPS LOGIC ---
  useEffect(() => {
    socket.connect();

    const onConnect = () => {
      console.log("✅ Connected! ID:", socket.id);
      console.log("🚀 Transport:", socket.io.engine.transport.name);
    };

    const onUpgrade = () => {
      console.log(
        "✨ Transport upgraded:",
        socket.io.engine.transport.name
      );
    };

    socket.on("connect", onConnect);
    socket.io.engine.on("upgrade", onUpgrade);

    const myRegNo = localStorage.getItem("driverRegNo");
    if (myRegNo) {
      socket.emit("join_app_session", myRegNo);
    }

    const handleDriverAssigned = (data) => {
      if (data.driverRegNo && data.driverRegNo !== myRegNo) return;

      toast.info(`New Trip Assigned! #${data.tripId || ""}`, {
        duration: 8000,
        action: {
          label: "OPEN",
          onClick: () => (window.location.href = "/my-trips"),
        },
      });
    };

    socket.on("driver_assigned", handleDriverAssigned);

    // ✅ LOCATION START
    startLocationWatch();

    return () => {
      socket.disconnect();
      socket.off("driver_assigned", handleDriverAssigned);
      socket.off("connect", onConnect);
      socket.io.engine.off("upgrade", onUpgrade);

      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [startLocationWatch]);

  // --- 4. RENDER LOADER ---
  if (appInitializing) {
    return <Loader message="CONNECTING PATRA ELITE DRIVERS..." />;
  }

  // --- 5. MAIN RENDER ---
  return (
    <Router>
      <Toaster
        position="top-center"
        richColors
        closeButton
        theme="light"
        toastOptions={{
          style: {
            fontSize: "14px",
            fontWeight: "600",
            fontFamily: "'Inter', sans-serif",
            padding: "16px 24px",
          },
          duration: 2000,
        }}
      />
      <AppRoutes />
    </Router>
  );
}

export default App;