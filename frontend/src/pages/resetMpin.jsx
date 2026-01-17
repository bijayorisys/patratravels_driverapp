import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import OtpInput from "react-otp-input";
import api from "../api/Api.js";
import patraLogo from "../assets/logo.png";

const MpinResetPage = () => {
  const navigate = useNavigate();
  const [newMpin, setNewMpin] = useState("");
  const [confirmMpin, setConfirmMpin] = useState("");
  const [loading, setLoading] = useState(false);

  const mobileNumber = localStorage.getItem("driverMobile");
  const token = localStorage.getItem("driverToken");

  useEffect(() => {
    if (!mobileNumber || !token) {
      toast.error("Verification required. Please login with OTP first.");
      navigate("/login", { replace: true });
    }
  }, [mobileNumber, token, navigate]);

  const handleResetMpin = async (e) => {
    e.preventDefault();

    if (newMpin.length !== 4 || confirmMpin.length !== 4) {
      return toast.error("MPIN must be 4 digits.");
    }

    if (newMpin !== confirmMpin) {
      return toast.error("New MPIN and Confirm MPIN do not match.");
    }

    setLoading(true);

    try {
      const response = await api.post(
        "/auth/reset-mpin",
        { mobileNumber, newMpin },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success(response.data.message || "MPIN reset successfully!");
      // Optional: You might want to keep the mobile for next login,
      // but remove it if you want fresh flow
      // localStorage.removeItem('driverMobile');
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const errorMessage = err.response?.data?.message || "MPIN reset failed.";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!mobileNumber || !token) return null;

  return (
    <div className="auth-master-container">
      <style>
        {`
          /* --- GLOBAL & FONTS --- */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          
          body { margin: 0; padding: 0; box-sizing: border-box; overflow:hidden; }
          
          .auth-master-container {
            min-height: 100dvh;
            width: 100%;
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
            border-radius: 28px;
            padding: 40px 30px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.15);
            text-align: center;
            animation: fadeIn 0.4s ease-out;
            box-sizing: border-box;
          }

          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }

          /* --- LOGO --- */
          .logo-area {
            margin-bottom: 20px;
            display: flex;
            justify-content: center;
          }
          .brand-logo {
            height: 60px;
            width: auto;
            display: block;
          }

          h2 {
            margin: 0 0 8px 0;
            color: #1a1a1a;
            font-size: 24px;
            font-weight: 800;
          }

          p.subtext {
            color: #666;
            font-size: 14px;
            margin: 0 0 30px 0;
            line-height: 1.5;
            font-weight: 500;
          }

          /* --- INPUT LABELS --- */
          .input-label {
            display: block;
            text-align: left;
            font-size: 11px;
            font-weight: 800;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }

          /* --- OTP INPUTS --- */
          .otp-container {
            display: flex;
            justify-content: center;
            width: 100%;
            margin-bottom: 25px;
          }
          
          .otp-box {
            width: 56px !important;
            height: 56px !important;
            margin: 0 6px !important;
            border: 2px solid #eef0f3 !important;
            border-radius: 16px !important;
            font-size: 24px !important;
            font-weight: 700 !important;
            color: #1a1a1a !important;
            text-align: center;
            background: #f8f9fa !important;
            outline: none;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
            padding: 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.02);
          }
          
          .otp-box:focus {
            border-color: #0062cc !important;
            background: #ffffff !important;
            box-shadow: 0 0 0 4px rgba(0, 98, 204, 0.15) !important;
            transform: translateY(-2px);
          }

          /* --- BUTTON ROW (Submit + Back) --- */
          .btn-row {
            display: flex;
            align-items: center;
            gap: 12px; /* Space between the two buttons */
            margin-top: 10px;
          }

          /* --- SUBMIT BUTTON --- */
          .btn-primary {
            flex: 1; /* Takes up all available space */
            background: #0062cc;
            color: white;
            border: none;
            border-radius: 16px;
            padding: 0 18px; /* Horizontal padding */
            height: 56px; /* Fixed height to match inputs */
            font-size: 15px;
            font-weight: 800;
            letter-spacing: 0.5px;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(0, 98, 204, 0.2);
            transition: transform 0.1s, box-shadow 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .btn-primary:hover { 
            background: #0056b3; 
            box-shadow: 0 10px 25px rgba(0, 98, 204, 0.3);
            transform: translateY(-1px);
          }
          
          .btn-primary:disabled { background: #b0c4de; cursor: not-allowed; box-shadow: none; }

          /* --- BACK BUTTON (Square) --- */
          .back-icon-btn {
            width: 56px; /* Same width as height -> Square */
            height: 56px; /* Matches height of Submit Button */
            background: #f0f7ff; /* Light blue bg */
            border: 2px solid transparent;
            border-radius: 16px;
            color: #0062cc;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
          }

          .back-icon-btn:hover {
            background-color: #0062cc;
            color: white;
            box-shadow: 0 8px 20px rgba(0, 98, 204, 0.2);
            transform: translateY(-2px);
          }
          
          /* --- MOBILE RESPONSIVENESS --- */
          @media (max-width: 380px) {
             .sheet-card { padding: 30px 20px; }
             .otp-box { 
                width: 48px !important; 
                height: 48px !important; 
                margin: 0 4px !important; 
                font-size: 20px !important; 
             }
          }
        `}
      </style>

      <div className="sheet-card">
        {/* Logo Section */}
        <div className="logo-area">
          <img src={patraLogo} alt="Patra Travels" className="brand-logo" />
        </div>

        <h2>Reset MPIN</h2>
        <p className="subtext">Please create your new 4-digit security code.</p>

        <form onSubmit={handleResetMpin}>
          {/* NEW MPIN */}
          <div>
            <label className="input-label">New MPIN</label>
            <div className="otp-container">
              <OtpInput
                value={newMpin}
                onChange={(value) => setNewMpin(value.replace(/\D/g, ""))}
                numInputs={4}
                inputType="tel"
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
                inputStyle="otp-box"
                containerStyle={{ justifyContent: "center" }}
                shouldAutoFocus
              />
            </div>
          </div>

          {/* CONFIRM MPIN */}
          <div>
            <label className="input-label">Confirm New MPIN</label>
            <div className="otp-container">
              <OtpInput
                value={confirmMpin}
                onChange={(value) => setConfirmMpin(value.replace(/\D/g, ""))}
                numInputs={4}
                inputType="tel"
                renderInput={(props) => (
                  <input
                    {...props}
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                  />
                )}
                inputStyle="otp-box"
                containerStyle={{ justifyContent: "center" }}
              />
            </div>
          </div>

          {/* BUTTON ROW: Submit + Back Button */}
          <div className="btn-row">
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? "RESETTING..." : "RESET MPIN"}
            </button>

            <button
              type="button"
              className="back-icon-btn"
              onClick={() => navigate(-1)}
              title="Go Back"
            >
              <ArrowLeft size={24} strokeWidth={2.5} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MpinResetPage;
