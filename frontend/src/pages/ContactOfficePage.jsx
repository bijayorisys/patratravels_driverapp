import React, { useState } from "react";
import { 
  Phone, 
  MapPin, 
  Mail, 
  Clock, 
  Navigation, 
  Headphones, 
  AlertTriangle,
  Send
} from "lucide-react";
import Swal from "sweetalert2";

const ContactOfficePage = () => {
  const [msg, setMsg] = useState("");

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!msg.trim()) return;
    
    // Simulate sending
    Swal.fire({
      icon: "success",
      title: "Message Sent",
      text: "Support team will contact you shortly.",
      timer: 2000,
      showConfirmButton: false,
      customClass: { popup: "rounded-4" }
    });
    setMsg("");
  };

  const openMap = () => {
    // Opens Google Maps with Office Coordinates (Example: Bhubaneswar)
    window.open("https://www.google.com/maps/search/?api=1&query=Patra+Travels+Office+Bhubaneswar", "_blank");
  };

  return (
    <div className="container-fluid p-0 pb-5">
      
      {/* Header */}
      <div className="bg-white p-4 pb-2 mb-3">
        <h2 className="fw-bold text-dark">Help & Support</h2>
        <p className="text-muted">Get in touch with the fleet management team.</p>
      </div>

      <div className="px-3" style={{ maxWidth: "600px", margin: "0 auto" }}>
        
        {/* 1. Quick Call Cards */}
        <div className="row g-2 mb-4">
          <div className="col-6">
            <a href="tel:+919999999999" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-primary text-white text-center p-3 hover-scale">
                <div className="mb-2 bg-white bg-opacity-25 d-inline-block p-2 rounded-circle">
                   <Phone size={24} fill="currentColor" />
                </div>
                <h6 className="fw-bold mb-0">Transport Mgr.</h6>
                <small className="opacity-75">Urgent Issues</small>
              </div>
            </a>
          </div>
          <div className="col-6">
            <a href="tel:+918888888888" className="text-decoration-none">
              <div className="card border-0 shadow-sm rounded-4 h-100 bg-white text-dark text-center p-3 hover-scale">
                <div className="mb-2 bg-light d-inline-block p-2 rounded-circle text-primary">
                   <Headphones size={24} />
                </div>
                <h6 className="fw-bold mb-0">Support / HR</h6>
                <small className="text-muted">General Query</small>
              </div>
            </a>
          </div>
        </div>

        {/* 2. Emergency Section */}
        <div className="card border-0 shadow-sm rounded-4 bg-danger bg-opacity-10 border border-danger p-3 mb-4">
           <div className="d-flex align-items-center">
              <div className="bg-danger text-white p-2 rounded-circle me-3">
                 <AlertTriangle size={24} />
              </div>
              <div className="flex-grow-1">
                 <h6 className="fw-bold text-danger mb-0">Accident / Breakdown?</h6>
                 <small className="text-dark">Call the 24/7 Emergency Line</small>
              </div>
              <a href="tel:112" className="btn btn-danger rounded-pill fw-bold px-3">Call SOS</a>
           </div>
        </div>

        {/* 3. Office Location Card */}
        <div className="card border-0 shadow-sm rounded-4 mb-4">
           <div className="card-body p-0">
              {/* Fake Map Preview (Grey Box) */}
              <div 
                className="bg-secondary bg-opacity-10 w-100 d-flex align-items-center justify-content-center cursor-pointer" 
                style={{ height: "120px", borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}
                onClick={openMap}
              >
                 <div className="btn btn-white shadow-sm rounded-pill fw-bold text-primary d-flex align-items-center gap-2 px-3">
                    <Navigation size={18} /> Navigate to Office
                 </div>
              </div>
              
              <div className="p-3">
                 <h5 className="fw-bold mb-2">Head Office</h5>
                 <div className="d-flex align-items-start mb-2 text-muted">
                    <MapPin size={18} className="me-2 mt-1 flex-shrink-0" />
                    <small>Plot No. 123, Saheed Nagar, Bhubaneswar, Odisha, 751007</small>
                 </div>
                 <div className="d-flex align-items-center mb-2 text-muted">
                    <Clock size={18} className="me-2 flex-shrink-0" />
                    <small>Open: 9:00 AM - 6:00 PM (Mon-Sat)</small>
                 </div>
                 <div className="d-flex align-items-center text-muted">
                    <Mail size={18} className="me-2 flex-shrink-0" />
                    <small>support@patratravels.com</small>
                 </div>
              </div>
           </div>
        </div>

        {/* 4. Quick Message Form */}
        <h6 className="fw-bold text-secondary ps-2 mb-2">Send a Message</h6>
        <form onSubmit={handleSendMessage} className="position-relative">
           <textarea 
             className="form-control rounded-4 border-0 shadow-sm p-3" 
             rows="3" 
             placeholder="Type your query regarding payments, leave, or vehicle..."
             style={{ resize: "none", paddingRight: "50px" }}
             value={msg}
             onChange={(e) => setMsg(e.target.value)}
           ></textarea>
           <button 
             type="submit" 
             className="btn btn-primary rounded-circle position-absolute shadow-sm d-flex align-items-center justify-content-center"
             style={{ width: "40px", height: "40px", right: "10px", bottom: "10px" }}
           >
              <Send size={18} className="ms-1 mt-1" />
           </button>
        </form>

      </div>
    </div>
  );
};

export default ContactOfficePage;