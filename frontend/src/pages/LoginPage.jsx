import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import OtpInput from "react-otp-input";
import patraLogo from "../assets/logo.png";
import api from "../api/Api.js";

const STAGE = { INITIAL: "initial", OTP: "otp", MPIN_LOGIN: "mpin_login" };
const REMEMBER_ME_KEY = "patra_auth_remember";
const MPIN_LOCK_KEY = "patra_mpin_locked";

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const isLockoutActive = searchParams.get("lockout") === "true";

  const [isOtpOnly, setIsOtpOnly] = useState(false);
  const [stage, setStage] = useState(STAGE.INITIAL);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Inputs
  const [driverId, setDriverId] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [mpinInput, setMpinInput] = useState("");
  const [visibleOtp, setVisibleOtp] = useState("");

  const [resendTimer, setResendTimer] = useState(0);
  const [isMpinLocked, setIsMpinLocked] = useState(false);

  // --- 1. CLEANUP TOASTS ON UNMOUNT (FIX FOR STUCK ALERTS) ---
  useEffect(() => {
    return () => {
      toast.dismiss(); // This clears ALL toasts when leaving this page
    };
  }, []);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  /* =====================
     REMEMBER ME
  ====================== */
  useEffect(() => {
    const saved = localStorage.getItem(REMEMBER_ME_KEY);
    if (saved) {
      try {
        const { savedDriverId, savedMobile } = JSON.parse(saved);
        setDriverId(savedDriverId || "");
        setMobileNumber(savedMobile || "");
        setRememberMe(true);
      } catch {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }
    }

    const locked = localStorage.getItem(MPIN_LOCK_KEY) === "true";
    setIsMpinLocked(locked);

    if (isLockoutActive || locked) {
      setStage(STAGE.INITIAL);
    }
  }, [isLockoutActive]);

  /* =====================
     SUCCESS HANDLER
  ====================== */
  const handleSuccess = (
    token,
    isFirstTime,
    mobile,
    dId,
    wasMpinLocked = false
  ) => {
    // 1. Clear any stuck loading toasts immediately
    toast.dismiss();

    if (rememberMe) {
      localStorage.setItem(
        REMEMBER_ME_KEY,
        JSON.stringify({ savedDriverId: dId, savedMobile: mobile })
      );
    } else {
      localStorage.removeItem(REMEMBER_ME_KEY);
    }

    localStorage.setItem("driverToken", token);
    localStorage.setItem("driverMobile", mobile);
    localStorage.setItem("driverRegNo", dId);

    if (isFirstTime) {
      toast.success("Please set your MPIN to login");
      setTimeout(() => navigate("/setup-mpin", { replace: true }), 1000);
    } else if (wasMpinLocked) {
      toast.error("Your MPIN is locked. Please reset it.");
      localStorage.removeItem(MPIN_LOCK_KEY);
      setIsMpinLocked(false);
      setTimeout(() => navigate("/reset-mpin", { replace: true }), 1500);
    } else {
      toast.success("Welcome back! Login successful.");
      setTimeout(() => navigate("/dashboard", { replace: true }), 1000);
    }
  };

  /* =====================
     REQUEST OTP
  ====================== */
  const handleRequestOtp = async (e) => {
    if (e) e.preventDefault();
    if (!driverId || !mobileNumber)
      return toast.error("Please fill all fields");

    setLoading(true);
    // Use an ID so we can update this specific toast
    const toastId = toast.loading("Sending OTP...");

    try {
      const res = await api.post("/auth/login", { driverRegNo: driverId, mobileNumber });

      // Update the loading toast to success (Replaces the spinner)
      toast.success(res.data.message || "OTP sent", { id: toastId });

      if (res.data.dev_otp) setVisibleOtp(res.data.dev_otp);
      setStage(STAGE.OTP);
      setOtp("");
      setResendTimer(30);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request OTP", {
        id: toastId,
      });
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     VERIFY OTP
  ====================== */
  const handleVerifyOtp = async () => {
    if (otp.length !== 4) return toast.error("Enter valid 4-digit OTP");
    setLoading(true);
    const toastId = toast.loading("Verifying...");

    try {
      const res = await api.post("/auth/verify-otp", { mobileNumber, otp , driverRegNo: driverId});

      // Dismiss immediately before success handler logic runs
      toast.dismiss(toastId);

      const locked = localStorage.getItem(MPIN_LOCK_KEY) === "true";
      handleSuccess(
        res.data.token,
        res.data.isFirstTime,
        mobileNumber,
        driverId,
        locked
      );
    } catch {
      toast.dismiss(toastId);
      toast.error("OTP verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     MPIN LOGIN
  ====================== */
  const handleMpinLogin = async (e) => {
    e.preventDefault();
    if (mpinInput.length !== 4) return toast.error("Enter 4-digit MPIN");

    setLoading(true);
    const toastId = toast.loading("Logging in...");

    try {
      const response = await api.post("/auth/mpin-login", {
        driverRegNo: driverId,
        mpin: mpinInput,
      });

      toast.dismiss(toastId);
      handleSuccess(response.data.token, false, mobileNumber, driverId);
    } catch (err) {
      const data = err.response?.data;
      toast.dismiss(toastId);
      toast.error(data?.message || "MPIN login failed");

      setMpinInput("");

      if (data?.locked === true) {
        localStorage.setItem(MPIN_LOCK_KEY, "true");
        setIsMpinLocked(true);
        setTimeout(() => {
          setStage(STAGE.INITIAL);
          navigate("/login?lockout=true", { replace: true });
        }, 1500);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex align-items-center justify-content-center position-relative"
      style={{
        background: "linear-gradient(135deg, #ff7e46 0%, #2f80ed 100%)",
        overflow: "hidden",
      }}
    >
      {/* CUSTOM CSS FOR PREMIUM LOOK */}
      <style>{`
        /* Floating Labels (Material UI Style) */
        .form-floating > .form-control {
          height: 3.5rem;
          line-height: 1.25;
          border-radius: 16px; /* Premium Roundness */
          border: 1.5px solid #e0e0e0;
          font-weight: 500;
        }
        .form-floating > label {
          padding: 1rem 1.25rem;
          color: #6c757d;
        }
        .form-floating > .form-control:focus {
          border-color: #0062cc;
          box-shadow: 0 0 0 4px rgba(0, 98, 204, 0.1);
        }
        .form-floating > .form-control:focus ~ label,
        .form-floating > .form-control:not(:placeholder-shown) ~ label {
          color: #0062cc;
          font-weight: 600;
          transform: scale(0.85) translateY(-0.75rem) translateX(0.15rem);
        }

        /* OTP Boxes */
        .otp-box-style {
          width: 50px !important;
          height: 50px !important;
          border-radius: 12px;
          border: 1.5px solid #e0e0e0;
          font-size: 20px;
          font-weight: bold;
          text-align: center;
          color: #333;
          background: #f8f9fa;
          transition: all 0.2s ease;
        }
        .otp-box-style:focus {
          border-color: #0062cc;
          background: #fff;
          box-shadow: 0 0 0 4px rgba(0, 98, 204, 0.1);
          outline: none;
          transform: translateY(-2px);
        }

        /* Buttons */
        .btn-premium-primary {
          background: #0062cc; color: white; border: none;
          border-radius: 16px; padding: 14px; font-weight: 600;
          box-shadow: 0 4px 15px rgba(0, 98, 204, 0.3);
          transition: transform 0.1s;
        }
        .btn-premium-primary:active { transform: scale(0.98); }
        .btn-premium-primary:disabled { background: #b0c4de; box-shadow: none; cursor: not-allowed; }
        
        .btn-premium-secondary {
          background: transparent; color: #555; border: 1.5px solid #e0e0e0;
          border-radius: 16px; padding: 12px; font-weight: 600;
          transition: 0.2s;
        }
        .btn-premium-secondary:hover { background: #f8f9fa; border-color: #ccc; }

        /* Card Animation */
        .fade-in-up { animation: fadeInUp 0.5s ease-out; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* Note: NO <Toaster /> here. It should be in App.js */}

      <div
        className="card border-0 shadow-lg p-4 p-md-5 text-center fade-in-up mx-3"
        style={{
          maxWidth: "420px",
          width: "100%",
          borderRadius: "28px",
          background: "#ffffff",
        }}
      >
        {/* LOGO */}
        <div className="mb-4 d-flex justify-content-center">
          <img
            src={patraLogo}
            alt="Patra Travels"
            style={{ height: "65px", objectFit: "contain" }}
          />
        </div>

        {/* --- STAGE 1: INITIAL LOGIN --- */}
        {stage === STAGE.INITIAL && (
          <div>
            <h3 className="fw-bold mb-1 text-dark">Secure Driver Access</h3>
            <p className="text-muted small mb-4">
              Enter your credentials to continue
            </p>

            {isLockoutActive && (
              <div className="alert alert-warning border-0 bg-warning bg-opacity-10 text-warning d-flex align-items-center p-3 mb-4 rounded-3 text-start small fw-bold">
                ⚠️ Too many attempts. Please use OTP login.
              </div>
            )}

            <form onSubmit={handleRequestOtp}>
              {/* Bootstrap Floating Input 1 */}
              <div className="form-floating mb-3">
                <input
                  type="text"
                  className="form-control"
                  id="driverIdInput"
                  placeholder="Driver ID"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  required
                />
                <label htmlFor="driverIdInput">Driver ID</label>
              </div>

              {/* Bootstrap Floating Input 2 */}
              <div className="form-floating mb-4">
                <input
                  type="tel"
                  className="form-control"
                  id="mobileInput"
                  placeholder="Mobile Number"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
                <label htmlFor="mobileInput">Mobile Number</label>
              </div>

              {/* Checkbox */}
              <div className="form-check text-start mb-4 ps-4">
                <input
                  className="form-check-input border-2"
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{
                    cursor: "pointer",
                    width: "18px",
                    height: "18px",
                    marginTop: "2px",
                  }}
                />
                <label
                  className="form-check-label small text-secondary fw-bold ms-2"
                  htmlFor="rememberMe"
                  style={{ cursor: "pointer" }}
                >
                  Remember Me
                </label>
              </div>

              <button
                className="btn btn-premium-primary w-100"
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="animate-spin" size={20} />
                ) : (
                  "GET OTP"
                )}
              </button>

              {!isOtpOnly && !isMpinLocked && (
                <div className="mt-4 pt-2 border-top">
                  <button
                    type="button"
                    onClick={() => {
                      setStage(STAGE.MPIN_LOGIN);
                      navigate("/mpin-login");
                    }}
                    className="btn btn-premium-secondary w-100"
                  >
                    Login with MPIN
                  </button>
                </div>
              )}
            </form>
          </div>
        )}

        {/* --- STAGE 2: OTP VERIFICATION --- */}
        {stage === STAGE.OTP && (
          <div>
            <h3 className="fw-bold mb-2 text-dark">Verify OTP</h3>
            <p className="text-muted small mb-4">
              Enter the 4-digit code sent to <br />{" "}
              <strong className="text-dark">{mobileNumber}</strong>
            </p>

            {visibleOtp && (
              <div className="alert alert-success border-0 bg-success bg-opacity-10 text-success py-2 mb-3 small fw-bold rounded-3">
                Dev OTP: {visibleOtp}
              </div>
            )}

            <div className="d-flex justify-content-center mb-4">
              <OtpInput
                value={otp}
                onChange={(val) => setOtp(val.replace(/[^0-9]/g, ""))}
                numInputs={4}
                renderInput={(props) => (
                  <input
                    {...props}
                    className="otp-box-style"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="one-time-code"
                  />
                )}
                containerStyle={{ gap: "12px" }}
                shouldAutoFocus={true}
              />
            </div>

            <button
              className="btn btn-premium-primary w-100"
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 4}
            >
              {loading ? "Verifying..." : "CONFIRM & LOGIN"}
            </button>

            <div className="mt-4 text-center">
              {resendTimer > 0 ? (
                <p className="text-secondary small fw-medium mb-0">
                  Resend code in{" "}
                  <span className="fw-bold text-dark">{resendTimer}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => handleRequestOtp()}
                  className="btn btn-link text-decoration-none fw-bold small text-uppercase p-0"
                  style={{ color: "#0062cc" }}
                  disabled={loading}
                >
                  Resend Code
                </button>
              )}
            </div>

            <div className="mt-4 pt-2 border-top">
              <button
                type="button"
                onClick={() => {
                  setStage(STAGE.MPIN_LOGIN);
                  navigate("/mpin-login");
                }}
                className="btn btn-premium-secondary w-100"
              >
                Login with MPIN
              </button>
            </div>
          </div>
        )}

        {/* --- STAGE 3: MPIN LOGIN --- */}
        {stage === STAGE.MPIN_LOGIN && (
          <div>
            <h3 className="fw-bold mb-2 text-dark">MPIN Access</h3>
            <p className="text-muted small mb-4">
              Enter your 4-digit security pin
            </p>

            <div className="form-floating mb-4">
              <input
                className="form-control"
                id="mpinId"
                placeholder="Driver ID"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value.toUpperCase())}
                style={{ backgroundColor: driverId ? "#f8f9fa" : "#fff" }}
                required
              />
              <label htmlFor="mpinId">Driver ID</label>
            </div>

            <div className="d-flex justify-content-center mb-4">
              <OtpInput
                value={mpinInput}
                onChange={setMpinInput}
                numInputs={4}
                renderInput={(props) => (
                  <input
                    {...props}
                    type="password"
                    inputMode="numeric"
                    className="otp-box-style"
                  />
                )}
                containerStyle={{ gap: "12px" }}
                shouldAutoFocus={true}
              />
            </div>

            <button
              className="btn btn-premium-primary w-100"
              onClick={handleMpinLogin}
              disabled={loading || mpinInput.length !== 4}
            >
              {loading ? "Logging in..." : "LOGIN"}
            </button>

            <div className="mt-4 pt-2 border-top">
              <button
                className="btn btn-premium-secondary w-100"
                onClick={() => {
                  setStage(STAGE.INITIAL);
                  navigate("/login", { replace: true });
                }}
              >
                Login with Driver Id
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
