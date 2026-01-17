import React, { useEffect, useLayoutEffect, useState, useRef } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  User,
  FileText,
  ShieldCheck,
  Bell,
  History,
  ClipboardList,
  LayoutDashboard,
  Siren,
  X,
  Menu,
  Fuel,
  PhoneCall,
} from "lucide-react";
import api, { IMAGE_BASE_URL } from "../api/Api";
import { toast } from "sonner";
import Swal from "sweetalert2";

// === CSS STYLES ===
const appStyles = `
  /* --- SOS ANIMATIONS --- */
@keyframes sos-pulse-ring {
    0% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); opacity: 1; }
    70% { transform: scale(1); box-shadow: 0 0 0 60px rgba(220, 53, 69, 0); opacity: 0; }
    100% { transform: scale(0.8); box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); opacity: 0; }
  }

  @keyframes sos-radar-wave {
    0% { width: 100px; height: 100px; opacity: 0.8; border: 2px solid rgba(220, 53, 69, 0.8); }
    100% { width: 300px; height: 300px; opacity: 0; border: 2px solid rgba(220, 53, 69, 0); }
  }
  
  .sos-radar-circle {
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    box-sizing: border-box;
    animation: sos-radar-wave 2s linear infinite;
    z-index: 0;
  }
  
  .sos-icon-container {
    animation: sos-pulse-ring 2s infinite;
  }

  .sos-pulse-always { background-color: #dc3545 !important; animation: radar-pulse 1.5s infinite; }
  @keyframes radar-pulse {
    0% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0.7); }
    70% { box-shadow: 0 0 0 10px rgba(220, 53, 69, 0); }
    100% { box-shadow: 0 0 0 0 rgba(220, 53, 69, 0); }
  }

  /* --- SIDEBAR STYLES --- */
  .sidebar-backdrop {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(0, 0, 0, 0.5); z-index: 1040;
    opacity: 0; visibility: hidden; transition: opacity 0.3s ease;
  }
  .sidebar-backdrop.show { opacity: 1; visibility: visible; }
  
  .sidebar-drawer {
    position: fixed; top: 0; left: 0; width: 280px; height: 100%;
    background: #ffffff; z-index: 1050;
    box-shadow: 4px 0 24px rgba(0,0,0,0.15);
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
    display: flex; flex-direction: column;
  }
  .sidebar-drawer.open { transform: translateX(0); }
  
  .sidebar-link {
    display: flex; align-items: center; padding: 14px 20px;
    color: #495057; text-decoration: none; font-weight: 500;
    transition: all 0.2s; border-radius: 8px;
    margin: 4px 10px;
  }
  .sidebar-link:hover { background: #f8f9fa; color: #0d6efd; }
  .sidebar-link.active {
    background: #e7f1ff; color: #0d6efd; font-weight: 600;
  }
`;

const HeaderLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const driverRegNo = localStorage.getItem("driverRegNo");

  // --- STATES ---
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(3);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sosTimerRef = useRef(null);

  // --- LOGIC STATES ---
  const [activeTripId, setActiveTripId] = useState(null);
  const [isPunchedIn, setIsPunchedIn] = useState(false);
  const [isDutyStarted, setIsDutyStarted] = useState(false);

  // --- PROFILE STATE ---
  const [profile, setProfile] = useState({
    full_name: "",
    phone: "",
    driver_photo: null,
  });

  // Inject Styles
  useLayoutEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = appStyles;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  // --- API CALLS ---
  useEffect(() => {
    if (!driverRegNo) return;

    // 1. Fetch Assigned Trip
    const fetchAssignedTrip = async () => {
      try {
        const res = await api.get(
          `/driver/assigned-trip?driver_regno=${driverRegNo}`
        );
        const tripData = Array.isArray(res.data) ? res.data : [res.data];
        // console.log("Assigned Trip Data:", tripData);
        if (tripData.length > 0 && tripData[0]?.enq_id) {
          setActiveTripId(tripData[0].enq_id);
        } else {
          setActiveTripId(null);
        }
      } catch (err) {
        setActiveTripId(null);
      }
    };

    // 2. Fetch Attendance (Today)
    const fetchAttendance = async () => {
      try {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, "0");
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const year = today.getFullYear();

        const res = await api.get(
          `/attendanceCheckDate/${driverRegNo}/${day}/${month}/${year}`
        );
        const data = res.data?.data || [];

        // Check if user is currently punched in (ck_sts usually 1 for IN)
        const punchedIn = data.length > 0 && Number(data[0].ck_sts) === 1;
        // console.log("Attendance Data:", data, "Is Punched In:", punchedIn);
        setIsPunchedIn(punchedIn);
      } catch (err) {
        console.error("Attendance fetch failed", err);
      }
    };

    // 3. Fetch Duty Status
    const fetchDutyStatus = async () => {
      try {
        const localDate = new Date().toLocaleDateString("en-CA");
        const res = await api.get(
          `/duty/status/${driverRegNo}?date=${localDate}`
        );
        const statusFromApi = res.data?.dutyStatus;
        // console.log("Duty Status from API:", statusFromApi);
        setIsDutyStarted(Number(statusFromApi) === 1);
      } catch (err) {
        console.error("Duty status fetch failed", err);
      }
    };

    // 4. Fetch Profile
    const fetchProfileDetails = async () => {
      try {
        const res = await api.get("/auth/profile");
        setProfile(res.data);
      } catch (err) {
        console.error("Profile sync failed");
      }
    };

    // Execute all
    fetchAssignedTrip();
    fetchAttendance();
    fetchDutyStatus();
    fetchProfileDetails();
  }, [driverRegNo, location.pathname]);

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + "/");

  // --- NAVIGATION LISTS ---
  const sidebarItems = [
    { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    {
      label: "My Trips",
      path: activeTripId ? `/my-trips/${activeTripId}` : "/my-trips",
      icon: ClipboardList,
    },
    { label: "Profile", path: "/profile", icon: User },
    { label: "Documents", path: "/documents", icon: FileText },
    { label: "Attendance", path: "/attendance-history", icon: History },
    { label: "Contact Office", path: "/contact-office", icon: PhoneCall },
    { label: "Refuel", path: "/refuel", icon: Fuel },
    { label: "Reset MPIN", path: "/reset-mpin", icon: ShieldCheck },
  ];

  const bottomNavItems = [
    { label: "Home", path: "/dashboard", icon: LayoutDashboard },
    {
      label: "Trip",
      path: activeTripId ? `/my-trips/${activeTripId}` : "/my-trips",
      icon: ClipboardList,
    },
    { label: "Refuel", path: "/refuel", icon: Fuel },
  ];

  // --- RESTRICTED NAVIGATION HANDLER ---
  const handleRestrictedNavigate = (item) => {
    if (item.label === "My Trips" || item.label === "Trip") {
      if (!activeTripId) {
        toast.error(
          "No active trip assigned at the moment. Please check with the office."
        );
        return;
      }
      if (!isPunchedIn || !isDutyStarted) {
        Swal.fire({
          icon: "warning",
          title: "Restricted Access",
          text: "Please submit your attendance first and start duty to go for trip",
          confirmButtonColor: "#5900ff",
          confirmButtonText: "OK",
          backdrop: true,
          allowOutsideClick: false,
        });
        return;
      }
    }
    setIsSidebarOpen(false);
    navigate(item.path);
  };

  // --- LOGOUT LOGIC ---
  const handleLogout = () => {
    toast.dismiss();
    setIsSidebarOpen(false);
    toast(
      (t) => (
        <div
          className="bg-white rounded-3 shadow-lg p-3"
          style={{ minWidth: "300px", borderLeft: "6px solid #ef4444" }}
        >
          <div className="d-flex align-items-start mb-3">
            <div className="me-3 mt-1 text-danger">
              <LogOut size={24} />
            </div>
            <div>
              <h6 className="fw-bold text-dark mb-1">Sign Out?</h6>
              <p className="text-muted mb-0 small">
                Are you sure you want to end your current session?
              </p>
            </div>
          </div>
          <div className="d-flex gap-2">
            <button
              className="btn btn-light flex-grow-1 fw-semibold border"
              onClick={() => toast.dismiss(t)}
            >
              Cancel
            </button>
            <button
              className="btn btn-danger flex-grow-1 fw-semibold shadow-sm"
              onClick={() => {
                localStorage.removeItem("driverToken");
                localStorage.removeItem("driverRegNo");
                localStorage.removeItem("driverMobile");
                toast.dismiss(t);
                toast.success("Logged out successfully");
                setTimeout(() => navigate("/login", { replace: true }), 500);
              }}
            >
              Logout
            </button>
          </div>
        </div>
      ),
      {
        duration: 3000,
        position: "top-center",
        style: { background: "transparent", border: "none", padding: 0 },
      }
    );
  };

  // --- HELPER: FETCH LOCATION NAME ---
  // const fetchLocationName = async (latitude, longitude) => {
  //   // 1. Validation
  //   if (!latitude || !longitude) return "Invalid Coordinates";

  //   try {
  //     // 2. Call YOUR Backend API (Secure Proxy)
  //     const res = await api.post("/location/geocode", {
  //       latitude: latitude,
  //       longitude: longitude,
  //     });

  //     // 3. Handle Success from your API
  //     if (res.data.success) {
  //       return res.data.address;
  //     } else {
  //       console.warn("Backend could not find address:", res.data.message);
  //       return "Unknown Location";
  //     }
  //   } catch (err) {
  //     console.error("❌ Location API Error:", err);
  //     return "Unknown Location";
  //   }
  // };

  // --- SOS LOGIC ---
  useEffect(() => {
    let interval = null;
    if (showSosModal && sosCountdown > 0) {
      interval = setInterval(() => setSosCountdown((prev) => prev - 1), 1000);
      sosTimerRef.current = interval;
    } else if (showSosModal && sosCountdown === 0) {
      clearInterval(interval);
      setShowSosModal(false);
      handleTriggerSosApi();
    }
    return () => clearInterval(interval);
  }, [showSosModal, sosCountdown]);

  const handleTriggerSosApi = async () => {
  if (navigator.geolocation) {
    // 1. Get Coordinates (Required)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Show loading
        const loadingToast = toast.loading("Sending Emergency Alert...");

        try {
          await api.post("/sos/trigger", {
            driverId: driverRegNo,
            latitude,
            longitude,
          });

          // 3. Success!
          toast.dismiss(loadingToast);
          toast.success("SOS SIGNAL SENT TO ADMIN!", {
            style: { background: "#dc3545", color: "#fff" },
            icon: <Siren size={20} color="white" />,
          });
        } catch (err) {
          toast.dismiss(loadingToast);
          toast.error("SOS FAILED! CALL OFFICE.");
        }
      },
      (error) => {
        // Handle GPS errors specifically
        toast.error("GPS Error: Could not get location.");
      },
      // 4. GPS Options: High accuracy, but fail fast (10s max)
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  } else {
    toast.error("Geolocation not supported");
  }
};

  const handleSosTrigger = () => {
    setShowSosModal(true);
    setSosCountdown(3);
  };
  const handleCancelSos = () => {
    setShowSosModal(false);
    setSosCountdown(3);
    if (sosTimerRef.current) clearInterval(sosTimerRef.current);
    toast.success("Alert Cancelled");
  };

  return (
    <div className="d-flex flex-column min-vh-100 bg-white">
      {/* === 1. SIDEBAR (DRAWER) === */}
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? "show" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
      ></div>
      <div className={`sidebar-drawer ${isSidebarOpen ? "open" : ""}`}>
        {/* === SIDEBAR HEADER (Correct Profile Design) === */}
        <div
          className="p-3 mb-2 d-flex flex-column align-items-center justify-content-center text-center"
          style={{
            background: "linear-gradient(135deg, #fd7e14 0%, #ff9234 100%)",
            borderRadius: "0 0 24px 0",
            boxShadow: "0 4px 15px rgba(0,0,0,0.15)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Logo Name */}
          <div className="mb-3" onClick={() => navigate("/dashboard")}>
            <span
              className="fw-bold text-white lh-1"
              style={{ fontSize: "1.8rem" }}
            >
              P
            </span>
            <span
              className="fw-bold text-white lh-1"
              style={{ fontSize: "1rem", marginLeft: "-1px" }}
            >
              ATRA
            </span>
            <span
              className="fw-semibold text-dark opacity-75 lh-1"
              style={{ fontSize: "1rem", marginLeft: "6px" }}
            >
              TRAVELS
            </span>
          </div>

          {/* Profile Photo */}
          <div className="mb-2 position-relative">
            <div
              className="bg-success rounded-circle p-1 shadow-sm d-flex align-items-center justify-content-center"
              style={{ width: "80px", height: "80px", overflow: "hidden" }}
            >
              {profile.driver_photo ? (
                <img
                  src={`${IMAGE_BASE_URL}${profile.driver_photo}`}
                  alt="Driver"
                  className="rounded-circle"
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                /* --- CHANGED THIS PART --- */
                <span
                  className="text-white fw-bold"
                  style={{ fontSize: "2.5rem" }}
                >
                  {profile.fullName
                    ? profile.fullName.charAt(0).toUpperCase()
                    : "D"}
                </span>
              )}
            </div>
          </div>

          {/* Driver Name & ID */}
          <div className="text-white">
            <h6
              className="fw-bold mb-0 text-white text-uppercase"
              style={{ letterSpacing: "0.5px" }}
            >
              {profile.fullName || "Unknown Driver"}
            </h6>
            <span
              className="opacity-85 text-primary fw-bold"
              style={{ fontSize: "0.9rem" }}
            >
              {driverRegNo || "N/A"}
            </span>
          </div>

          {/* Decorative Circle */}
          <div
            style={{
              position: "absolute",
              top: "-20px",
              left: "-20px",
              width: "100px",
              height: "100px",
              background: "white",
              opacity: "0.1",
              borderRadius: "50%",
            }}
          ></div>
        </div>

        {/* Sidebar Links */}
        <div className="py-1 flex-grow-1 overflow-auto">
          {sidebarItems.map((item) => (
            <div
              key={item.path}
              onClick={() => handleRestrictedNavigate(item)}
              className={`sidebar-link cursor-pointer d-flex align-items-center p-2 mb-1 rounded-3 ${
                isActive(item.path.split("/")[1])
                  ? "active bg-info text-white shadow-sm"
                  : "text-dark"
              }`}
              style={{ transition: "all 0.2s ease" }}
            >
              <item.icon
                size={20}
                className={`me-3 ${
                  isActive(item.path.split("/")[1])
                    ? "opacity-100"
                    : "opacity-75"
                }`}
              />
              <span className="fw-semibold">{item.label}</span>
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-top">
          <button
            onClick={handleLogout}
            className="btn btn-light w-100 d-flex align-items-center justify-content-center text-danger fw-bold"
          >
            <LogOut size={18} className="me-2" /> Logout
          </button>
        </div>
      </div>

      {/* === IMPROVED SOS MODAL === */}
      {showSosModal && (
        <div
          className="fixed-top w-100 h-100 d-flex flex-column align-items-center justify-content-center"
          style={{ backgroundColor: "#0f1014", zIndex: 10000 }} // Dark Black/Grey Background
        >
          {/* 1. TOP: COUNTDOWN NUMBER */}
          <div className="mb-4">
            <h1
              className="text-white fw-bold display-1"
              style={{ fontSize: "5rem" }}
            >
              {sosCountdown}
            </h1>
          </div>

          {/* 2. CENTER: PULSING RADAR ICON */}
          <div
            className="position-relative d-flex align-items-center justify-content-center mb-5"
            style={{ width: "300px", height: "300px" }}
          >
            {/* Radar Waves */}
            <div
              className="sos-radar-circle"
              style={{ animationDelay: "0s" }}
            ></div>
            <div
              className="sos-radar-circle"
              style={{ animationDelay: "0.6s" }}
            ></div>
            <div
              className="sos-radar-circle"
              style={{ animationDelay: "1.2s" }}
            ></div>

            {/* Core Icon */}
            <div
              className="rounded-circle bg-danger bg-opacity-10 d-flex align-items-center justify-content-center sos-icon-container"
              style={{
                width: "140px",
                height: "140px",
                border: "4px solid #dc3545",
                boxShadow: "0 0 30px rgba(220, 53, 69, 0.4)",
                zIndex: 10,
              }}
            >
              <Siren
                size={60}
                className="text-danger"
                fill="#dc3545"
                fillOpacity={0.2}
              />
            </div>
          </div>

          {/* 3. BOTTOM: TEXT & ACTION */}
          <div className="text-center w-100 px-4" style={{ maxWidth: "400px" }}>
            <h5 className="text-white fw-bold mb-1 letter-spacing-1">
              SENDING ALERT IN...
            </h5>
            <h2
              className="text-danger fw-black mb-5"
              style={{
                fontSize: "2rem",
                fontWeight: "900",
                letterSpacing: "1px",
              }}
            >
              SOS INITIATED
            </h2>

            <button
              onClick={handleCancelSos}
              className="btn btn-danger w-100 rounded-pill py-3 fw-bold shadow-lg d-flex align-items-center justify-content-center gap-2"
              style={{ fontSize: "1.1rem", border: "2px solid #dc3545" }}
            >
              <X size={24} strokeWidth={3} /> CANCEL ALERT
            </button>
          </div>
        </div>
      )}

      {/* === 2. TOP HEADER (Fixed) === */}
      <header
        className="navbar navbar-expand-md navbar-light bg-white sticky-top shadow-sm px-3"
        style={{ height: "64px", zIndex: 900 }}
      >
        <div className="container-fluid mw-1200 px-0">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-white p-2 me-2 text-dark border-0"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} strokeWidth={2.5} />
            </button>
            <div
              className="d-flex align-items-baseline cursor-pointer text-decoration-none"
              onClick={() => navigate("/dashboard")}
            >
              <span
                className="fw-bold lh-1"
                style={{ fontSize: "2rem", color: "#fd7e14" }}
              >
                P
              </span>
              <span
                className="fw-bold lh-1"
                style={{
                  fontSize: "1rem",
                  marginLeft: "-1px",
                  color: "#fd7e14",
                }}
              >
                ATRA
              </span>
              <span
                className="fw-semibold text-dark lh-1"
                style={{ fontSize: "1rem", marginLeft: "6px" }}
              >
                TRAVELS
              </span>
            </div>
          </div>

          <div className="ms-auto d-flex align-items-center gap-2">
            <button
              className="btn btn-light rounded-circle p-2 text-secondary position-relative border-0"
              style={{ width: "40px", height: "40px" }}
            >
              <Bell size={20} />
              <span
                className="position-absolute bg-danger border border-2 border-white rounded-circle"
                style={{
                  width: "10px",
                  height: "10px",
                  top: "10px",
                  right: "10px",
                }}
              ></span>
            </button>
            <button
              className="btn btn-danger rounded-circle p-2 d-flex align-items-center justify-content-center border-0 ms-1 shadow-sm sos-pulse-always"
              onClick={handleSosTrigger}
              style={{ width: "42px", height: "42px" }}
            >
              <Siren size={22} fill="white" />
            </button>
            <button
              className="btn btn-light rounded-circle p-2 text-danger border-0 "
              onClick={handleLogout}
              style={{ width: "40px", height: "40px" }}
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* === 3. MAIN CONTENT === */}
      <main className="container-fluid bg-white flex-grow-1 py-2 px-2">
        <div
          className="mx-auto"
          style={{ maxWidth: "1200px", paddingBottom: "60px" }}
        >
          <Outlet />
        </div>
      </main>

      {/* === 4. BOTTOM NAV (Mobile Only) === */}
      <nav
        className="navbar fixed-bottom navbar-light bg-white d-md-none shadow-lg"
        style={{ paddingBottom: "env(safe-area-inset-bottom)", zIndex: 800 }}
      >
        <div
          className="container-fluid d-flex justify-content-around w-100 px-0"
          style={{
            boxShadow: "0 -3px 6px -4px rgba(255, 123, 0, 1)",
            borderRadius: "10px 10px 0 0",
          }}
        >
          {bottomNavItems.map((item) => (
            <div
              key={item.path}
              onClick={() => handleRestrictedNavigate(item)}
              className="d-flex flex-column align-items-center justify-content-center py-2 flex-grow-1 cursor-pointer"
              style={{ height: "60px" }}
            >
              <item.icon
                size={24}
                /* FIX 1: Pass item.path directly */
                strokeWidth={isActive(item.path) ? 2.5 : 2}
                className={
                  /* FIX 2: Pass item.path directly */
                  isActive(item.path)
                    ? "text-primary"
                    : "text-secondary opacity-50"
                }
              />
              <span
                className={`mt-1 fw-bold ${
                  /* FIX 3: Pass item.path directly */
                  isActive(item.path)
                    ? "text-primary"
                    : "text-secondary opacity-50"
                }`}
                style={{ fontSize: "11px" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default HeaderLayout;