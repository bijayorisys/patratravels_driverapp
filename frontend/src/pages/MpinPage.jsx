import React, { useState,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import OtpInput from "react-otp-input";
import api from "../api/Api.js";
import patraLogo from "../assets/logo.png";

const MpinSetupPage = () => {
  const navigate = useNavigate();
  const [mpin, setMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);

  const mobileNumber = localStorage.getItem("driverMobile");
  const token = localStorage.getItem("driverToken");

  // toast + navigate moved to useEffect
  useEffect(() => {
    if (!mobileNumber || !token) {
      toast.error(
        "Session expired or setup data missing. Please re-login.",
        { duration: 1500 }
      );

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);
    }
  }, [mobileNumber, token, navigate]);

  //prevent render
  if (!mobileNumber || !token) {
    return null;
  }

  const handleSetupMpin = async (e) => {
    e.preventDefault();

    if (mpin.length !== 4 || confirmMpin.length !== 4) {
      return toast.error("MPIN must be 4 digits.");
    }

    if (mpin !== confirmMpin) {
      return toast.error("MPIN and Confirm MPIN do not match.");
    }

    setLoading(true);
    try {
      const response = await api.post(
        "/auth/setup-mpin",
        { mobileNumber, mpin },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message, { duration: 1000 });

      localStorage.removeItem("driverMobile");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "MPIN setup failed."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-master-container">
      <style>
        {`
          /* --- GLOBAL & FONTS --- */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          body { margin: 0; padding: 0; box-sizing: border-box; overflow:hidden; }
          
          .auth-master-container {
            min-height: 100dvh;
            width: 100%;
            /* The specific orange-to-blue gradient */
            background: linear-gradient(135deg, #ff7e46 0%, #2f80ed 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Inter', sans-serif;
            padding: 20px;
            box-sizing: border-box;
          }

          /* --- CARD DESIGN --- */
          .sheet-card {
            width: 100%;
            max-width: 400px;
            background: #ffffff;
            border-radius: 24px;
            padding: 40px 30px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            text-align: center;
            position: relative;
            animation: fadeIn 0.4s ease-out;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* --- LOGO --- */
          .logo-area {
            margin-bottom: 25px;
            display: flex;
            justify-content: center;
          }
          .brand-logo {
            height: 65px;
            width: auto;
            display: block;
          }

          /* --- TYPOGRAPHY --- */
          h2 {
            margin: 0 0 10px 0;
            color: #1a1a1a;
            font-size: 22px;
            font-weight: 700;
          }

          p.subtext {
            color: #666;
            font-size: 14px;
            margin: 0 0 30px 0;
            line-height: 1.5;
            font-weight: 500;
          }

          .input-label {
            display: block;
            text-align: left;
            font-size: 12px;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            margin-left: 5px;
          }

          /* --- OTP INPUTS (Smooth & Round) --- */
          .otp-container {
            display: flex;
            justify-content: space-between; /* Spreads inputs evenly */
            gap: 5px;
            margin-bottom: 25px;
          }
          
          .otp-box {
            width: 100% !important; /* Allow flex to control width */
            max-width: 60px;
            height: 55px !important;
            border: 1.5px solid #d1d1d1 !important;
            border-radius: 14px !important;
            font-size: 22px !important;
            color: #333 !important;
            text-align: center;
            background: #fff !important;
            outline: none;
            transition: all 0.2s;
          }
          
          .otp-box:focus {
            border-color: #0062cc !important;
            box-shadow: 0 0 0 4px rgba(0, 98, 204, 0.1) !important;
            transform: translateY(-2px);
          }

          /* --- BUTTON --- */
          .btn-primary {
            width: 100%;
            background: #0062cc;
            color: white;
            border: none;
            border-radius: 16px;
            padding: 16px;
            font-size: 15px;
            font-weight: 600;
            letter-spacing: 0.5px;
            cursor: pointer;
            margin-top: 10px;
            box-shadow: 0 4px 12px rgba(0, 98, 204, 0.3);
            transition: transform 0.1s, box-shadow 0.2s;
          }

          .btn-primary:hover { background: #0056b3; }
          .btn-primary:active { transform: scale(0.98); }
          .btn-primary:disabled { background: #b0c4de; cursor: not-allowed; box-shadow: none; }
        `}
      </style>

      <div className="sheet-card">
        {/* Header / Logo Section */}
        <div className="logo-area">
          {/* Uses the same logo logic as the Login page */}
          <img src={patraLogo} alt="Patra Travels" className="brand-logo" />
        </div>

        <h2>Set Your MPIN</h2>
        <p className="subtext">
          Create a 4-digit code for faster daily access.
        </p>

        <form onSubmit={handleSetupMpin}>
        {/* NEW MPIN SECTION */}
        <div>
          <label className="input-label">New 4-Digit MPIN</label>
          <div className="otp-container">
            <OtpInput
              value={mpin}
              onChange={(value) => setMpin(value.replace(/\D/g, ""))}
              numInputs={4}
              shouldAutoFocus
              inputStyle="otp-box"
              containerStyle={{
                width: "100%",
                justifyContent: "space-between",
              }}
              renderInput={(props) => (
                <input
                  {...props}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete="one-time-code"
                />
              )}
            />
          </div>
        </div>

        {/* CONFIRM MPIN SECTION */}
        <div>
          <label className="input-label">Confirm MPIN</label>
          <div className="otp-container">
            <OtpInput
              value={confirmMpin}
              onChange={(value) => setConfirmMpin(value.replace(/\D/g, ""))}
              numInputs={4}
              inputStyle="otp-box"
              containerStyle={{
                width: "100%",
                justifyContent: "space-between",
              }}
              renderInput={(props) => (
                <input
                  {...props}
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  autoComplete="one-time-code"
                />
              )}
            />
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "SETTING UP..." : "SET MPIN"}
        </button>
      </form>

      </div>
    </div>
  );
};

export default MpinSetupPage;