import React from "react";
import IconLogo from "../assets/icon logo.png"; 

const Loader = ({ message = "Patra Driver World" }) => {
    return (
        <div className="driver-loader-overlay">
            <style>{`
                /* --- Variables --- */
                :root {
                    --driver-primary: #ff7300; /* Brand Orange */
                    --driver-secondary: #1e40af; /* Brand Blue */
                    --bg-color: #ffffff;
                }

                /* --- Main Container (Native App Feel) --- */
                .driver-loader-overlay {
                    position: fixed;
                    inset: 0;
                    background-color: var(--bg-color);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 99999;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    /* Subtle background pattern for premium feel */
                    background-image: radial-gradient(#e5e7eb 1px, transparent 1px);
                    background-size: 24px 24px;
                }

                /* --- Logo Container (The Pulse Center) --- */
                .logo-wrapper {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-bottom: 40px;
                }

                /* The Logo Image */
                .app-icon {
                    width: 60px;
                    height: 60px;
                    object-fit: contain;
                    z-index: 10;
                    /* Gentle breathing animation */
                    animation: logo-breathe 2s ease-in-out infinite;
                }

                /* --- Animations: Radar Ripples --- */
                .ripple {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    border: 2px solid var(--driver-primary);
                    opacity: 0;
                    z-index: 1;
                }

                .ripple:nth-child(1) {
                    animation: ripple-effect 2s linear infinite;
                }
                .ripple:nth-child(2) {
                    animation: ripple-effect 2s linear infinite 0.6s;
                }
                .ripple:nth-child(3) {
                    animation: ripple-effect 2s linear infinite 1.2s;
                }

                /* White Circle Background for Logo */
                .logo-bg {
                    position: absolute;
                    width: 90px;
                    height: 90px;
                    background: white;
                    border-radius: 50%;
                    box-shadow: 0 10px 25px rgba(255, 115, 0, 0.2);
                    z-index: 5;
                }

                /* --- Typography --- */
                .brand-title {
                    font-size: 24px;
                    font-weight: 800;
                    color: #111827; /* Dark Grey */
                    letter-spacing: -0.5px;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }

                .brand-highlight {
                    color: var(--driver-primary);
                }

                .loading-msg {
                    margin-top: 8px;
                    font-size: 12px;
                    font-weight: 600;
                    letter-spacing: 2px;
                    text-transform: uppercase;
                    color: #9ca3af; /* Light Grey */
                    position: relative;
                    display: inline-block;
                }

                /* Loading Dots Animation */
                .loading-msg::after {
                    content: '...';
                    animation: dots 1.5s steps(5, end) infinite;
                    position: absolute;
                    left: 100%;
                }

                /* --- Keyframes --- */
                @keyframes ripple-effect {
                    0% { transform: scale(0.8); opacity: 0.8; border-width: 4px; }
                    100% { transform: scale(2.5); opacity: 0; border-width: 0px; }
                }

                @keyframes logo-breathe {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }

                @keyframes dots {
                    0%, 20% { content: ''; }
                    40% { content: '.'; }
                    60% { content: '..'; }
                    80%, 100% { content: '...'; }
                }

                /* --- Bottom Branding (Optional) --- */
                .bottom-brand {
                    position: absolute;
                    bottom: 30px;
                    font-size: 10px;
                    color: #d1d5db;
                    font-weight: 500;
                }
            `}</style>

            {/* Logo Section with Radar Effect */}
            <div className="logo-wrapper">
                <div className="ripple"></div>
                <div className="ripple"></div>
                <div className="ripple"></div>
                
                <div className="logo-bg"></div>
                
                {/* ✅ YOUR ICON LOGO */}
                <img src={IconLogo} alt="Patra Travels" className="app-icon" />
            </div>

            {/* Text Section */}
            <div className="brand-title">
                <span className="brand-highlight">PATRA</span> TRAVELS
            </div>
            
            <div className="loading-msg">
                {message}
            </div>

            <div className="bottom-brand">DRIVER PARTNER APP</div>
        </div>
    );
};

export default Loader;