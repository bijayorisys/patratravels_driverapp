import React from "react";
import { Car } from "lucide-react";

const Loader = ({ message = "Patra Driver World" }) => {
    return (
        <div className="ultra-loader-overlay">
            <style>{`
                .ultra-loader-overlay {
                    position: fixed;
                    inset: 0;
                    /* Patra Travels Light Theme Gradient */
                    background: linear-gradient(135deg, #ff7e46 0%, #2f80ed 100%);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    overflow: hidden;
                }

                .loader-visual {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                /* Background Morphing Ring - Blue */
                .outer-pulse {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 2px solid #ff5e00ff;
                    border-radius: 35% 65% 70% 30% / 30% 30% 70% 70%;
                    animation: morph 3s linear infinite;
                    opacity: 0.3;
                }

                /* Static Diamond Base - Blue */
                .diamond-base {
                    width: 65px;
                    height: 65px;
                    background: #ff7300ff;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #fff;
                    box-shadow: 0 0 40px rgba(0, 98, 204, 0.4);
                    transform: rotate(45deg);
                    overflow: hidden;
                }

                /* Car "Running" Animation */
                .car-run-fix {
                    transform: rotate(-45deg); 
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: car-drive 1.5s infinite linear;
                }

                .car-icon {
                    animation: suspension-bounce 0.3s infinite alternate ease-in-out;
                }

                /* --- Updated Branding Section --- */
                .loading-brand-container {
                    margin-top: 40px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    text-align: center;
                }

                /* Dark text for Light Background */
                .brand-logo-main {
                    font-family: 'Inter', sans-serif;
                    font-weight: 900;
                    font-size: 18px;
                    color: #ff8800ff;
                    letter-spacing: -1px;
                    display: flex;
                    align-items: baseline;
                    animation: text-pulse 2s infinite ease-in-out;
                }

                /* Blue Accent */
                .p-accent-loader {
                    color: #ff7300ff;
                    font-size: 32px;
                    margin-right: 2px;
                }

                /* Darker text */
                .s-accent-loader {
                    font-weight: 700;
                    font-size: 18px;
                    color: #ffffffff;
                    margin-left: 6px;
                    letter-spacing: 1px;
                }

                /* Darker Subtext with Blue Shine */
                .loading-subtext {
                    margin-top: 10px;
                    font-size: 11px;
                    font-weight: 800;
                    color: #555;
                    letter-spacing: 3px;
                    text-transform: uppercase;
                    background: linear-gradient(90deg, #555 0%, #0062cc 50%, #555 100%);
                    background-size: 200% auto;
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: shine 3s linear infinite;
                }

                /* Animations */
                @keyframes morph {
                    0% { border-radius: 35% 65% 70% 30% / 30% 30% 70% 70%; transform: rotate(0deg); }
                    100% { border-radius: 35% 65% 70% 30% / 30% 30% 70% 70%; transform: rotate(360deg); }
                }

                @keyframes car-drive {
                    0% { transform: rotate(-45deg) translateX(-60px); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: rotate(-45deg) translateX(60px); opacity: 0; }
                }

                @keyframes suspension-bounce {
                    from { transform: translateY(0px); }
                    to { transform: translateY(-2px); }
                }

                @keyframes text-pulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(0.98); opacity: 0.8; }
                }

                @keyframes shine {
                    to { background-position: 200% center; }
                }

                /* Blue Glow for Light Theme */
                .bg-glow {
                    position: absolute;
                    width: 450px;
                    height: 450px;
                    background: radial-gradient(circle, rgba(0, 98, 204, 0.15) 0%, rgba(255,255,255,0) 70%);
                    z-index: -1;
                }
            `}</style>

            <div className="bg-glow"></div>
            
            <div className="loader-visual">
                <div className="outer-pulse"></div>
                <div className="diamond-base">
                    <div className="car-run-fix">
                        <Car className="car-icon" size={32} strokeWidth={2.5} color="white" />
                    </div>
                </div>
            </div>

            <div className="loading-brand-container">
                <div className="brand-logo-main">
                    <span className="p-accent-loader">P</span>ATRA <span className="s-accent-loader">TRAVELS</span>
                </div>
                <p className="loading-subtext">{message}</p>
            </div>
        </div>
    );
};

export default Loader;