import React, { useState, useRef, useEffect } from "react";
import {
  Fuel,
  MapPin,
  Camera,
  UploadCloud,
  Hash,
  History,
  X,
  CheckCircle,
  AlertCircle,
  Gauge,
  Droplets,
  Receipt,
  CreditCard,
  Banknote,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import api, { IMAGE_BASE_URL } from "../api/Api";

// --- 1. COMPRESSION HELPER ---
const compressImage = async (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const scaleSize = MAX_WIDTH / img.width;
        const newWidth = img.width > MAX_WIDTH ? MAX_WIDTH : img.width;
        const newHeight =
          img.width > MAX_WIDTH ? img.height * scaleSize : img.height;
        canvas.width = newWidth;
        canvas.height = newHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newWidth, newHeight);
        ctx.canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("Compression failed"));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: "image/jpeg",
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          "image/jpeg",
          0.6
        );
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

const RefuelPage = () => {
  // Refs
  const receiptRef = useRef(null);
  const fuelMeterRef = useRef(null);
  const oilMeterRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // History & View States
  const [logs, setLogs] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [fullImage, setFullImage] = useState(null);

  const [form, setForm] = useState({
    stationName: "",
    liters: "",
    pricePerLiter: "",
    amount: "",
    paymentMode: "Cash",
    paymentRef: "",

    // Images
    receipt: null,
    receiptPreview: null,
    fuelMeter: null,
    fuelMeterPreview: null,
    oilMeter: null,
    oilMeterPreview: null,
  });

  // --- FETCH HISTORY ---
  const fetchHistory = async () => {
    const driverRegNo = localStorage.getItem("driverRegNo");
    if (!driverRegNo) return;
    try {
      setHistoryLoading(true);
      const response = await api.get(`/refuel/fuelloghistory/${driverRegNo}`);
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (error) {
      console.error("History fetch error", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Auto-calculate Total
 // Auto-calculate Total
  useEffect(() => {
    const l = parseFloat(form.liters);
    const p = parseFloat(form.pricePerLiter);

    if (!isNaN(l) && !isNaN(p)) {
      setForm((prev) => ({ ...prev, amount: (l * p).toFixed(2) }));
    } else {
      setForm((prev) => ({ ...prev, amount: "" }));
    }
  }, [form.liters, form.pricePerLiter]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // --- IMAGE HANDLER ---
  const handleImageUpload = async (e, fieldKey) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setCompressing(true);
        const compressedFile = await compressImage(file);
        const previewUrl = URL.createObjectURL(compressedFile);

        setForm((prev) => ({
          ...prev,
          [fieldKey]: compressedFile,
          [`${fieldKey}Preview`]: previewUrl,
        }));

        toast.success("Image captured Successfully!");
      } catch (error) {
        toast.error("Failed to capture image!!");
      } finally {
        setCompressing(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const driverRegNo = localStorage.getItem("driverRegNo");

    if (!driverRegNo) return toast.error("Driver not identified.");

    // Validations (Receipt Mandatory)
    if (!form.stationName || !form.amount || !form.receipt) {
      return toast.error("Station, Amount & Bill Receipt are mandatory!");
    }

    setLoading(true);

    const formData = new FormData();
    formData.append("driver_id", driverRegNo);
    formData.append("station_name", form.stationName);
    formData.append("liters", form.liters);
    formData.append("price_per_liter", form.pricePerLiter);
    formData.append("total_amount", form.amount);

    // Payment Logic
    formData.append("payment_mode", form.paymentMode);
    formData.append(
      "transaction_id",
      form.paymentMode === "Company" ? form.paymentRef : ""
    );

    // Images
    formData.append("receipt_image", form.receipt);
    if (form.fuelMeter) formData.append("fuel_meter_image", form.fuelMeter);
    if (form.oilMeter) formData.append("oil_meter_image", form.oilMeter);

    try {
      const response = await api.post("/refuel/add", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Refuel Added",
          text: "Expenses logged successfully!",
          confirmButtonColor: "#0d6efd",
          customClass: { popup: "rounded-4" },
        });

        // Reset
        setForm({
          stationName: "",
          liters: "",
          pricePerLiter: "",
          amount: "",
          paymentMode: "Cash",
          paymentRef: "",
          receipt: null,
          receiptPreview: null,
          fuelMeter: null,
          fuelMeterPreview: null,
          oilMeter: null,
          oilMeterPreview: null,
        });
        fetchHistory();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save data");
    } finally {
      setLoading(false);
    }
  };

  // Helper
  const getImageUrl = (filename) => {
    if (!filename) return "";
    return `${IMAGE_BASE_URL}/uploads/refuel_receipt/${filename}`;
  };

  return (
    <div className="container-fluid p-0 bg-white min-vh-100 pb-5 position-relative">
      {/* Header */}
      <div className="bg-primary text-white p-4 rounded-bottom-4 shadow-sm mb-4 position-relative overflow-hidden">
        <Fuel
          size={140}
          className="position-absolute text-white opacity-10"
          style={{ right: -30, top: -20, transform: "rotate(15deg)" }}
        />
        <h2 className="fw-bold mb-1">Add Refuel</h2>
        <p className="mb-0 opacity-75 small">Log fuel expenses & upload bill</p>
      </div>

      <div className="px-3" style={{ maxWidth: "600px", margin: "0 auto" }}>
        <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
          {/* 1. Station & Amount */}
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
             <h6 className="text-uppercase text-success fw-bold mb-2 small ls-1">Fuel Details</h6>
            <div className="form-floating mb-3">
              <input
                type="text"
                className="form-control fw-bold fs-5"
                id="stationName"
                name="stationName"
                placeholder="Station Name"
                value={form.stationName}
                onChange={handleInputChange}
              />
              <label htmlFor="stationName">
                <MapPin size={16} className="me-2 text-primary" /> Station Name
              </label>
            </div>
           <div className="row g-2">
                  <div className="col-4">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control fw-bold"
                        id="liters"
                        name="liters"
                        placeholder="Liters"
                        inputMode="decimal" 
                        value={form.liters}
                        onChange={(e) => {
                          // REGEX: Only allow digits and ONE optional dot
                          const val = e.target.value;
                          if (/^\d*\.?\d*$/.test(val)) {
                            handleInputChange(e);
                          }
                        }}
                      />
                      <label htmlFor="liters" className="small text-muted">
                        Vol (L)
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control fw-bold"
                        id="pricePerLiter"
                        name="pricePerLiter"
                        placeholder="Rate"
                        inputMode="decimal" 
                        value={form.pricePerLiter}
                        onChange={(e) => {
                          // REGEX: Only allow digits and ONE optional dot
                          const val = e.target.value;
                          if (/^\d*\.?\d*$/.test(val)) {
                            handleInputChange(e);
                          }
                        }}
                      />
                      <label htmlFor="pricePerLiter" className="small text-muted">
                        Rate/L
                      </label>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control fw-bold text-success bg-light"
                        id="amount"
                        placeholder="Total"
                        value={form.amount}
                        readOnly
                      />
                      <label htmlFor="amount" className="small text-success fw-bold">
                        Total ₹
                      </label>
                    </div>
                  </div>
                </div>
          </div>

          {/* 2. Fuel & Oil Meter Images (Placed Here) */}
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <h6 className="fw-bold text-danger text-uppercase small mb-3 ls-1">
              METER READINGS
            </h6>
            <div className="row g-3">
              {/* Fuel Meter */}
              <div className="col-6">
                <div
                  className="border rounded-4 p-2 text-center bg-light cursor-pointer position-relative overflow-hidden"
                  style={{ height: "110px" }}
                  onClick={() => fuelMeterRef.current.click()}
                >
                  <input
                    type="file"
                    hidden
                    ref={fuelMeterRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, "fuelMeter")}
                  />
                  {form.fuelMeterPreview ? (
                    <img
                      src={form.fuelMeterPreview}
                      alt="Fuel"
                      className="w-100 h-100 object-fit-cover rounded-3"
                    />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                      <Gauge size={24} className="mb-1 text-primary" />
                      <span
                        className="small fw-bold"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Fuel Meter
                      </span>
                      <span
                        className="x-small text-secondary opacity-75"
                        style={{ fontSize: "0.65rem" }}
                      >
                        Tap to capture
                      </span>
                    </div>
                  )}
                  {form.fuelMeterPreview && (
                    <div className="position-absolute bottom-0 end-0 bg-white p-1 rounded-top-start-3">
                      <Camera size={12} />
                    </div>
                  )}
                </div>
              </div>

              {/* Oil Meter */}
              <div className="col-6">
                <div
                  className="border rounded-4 p-2 text-center bg-light cursor-pointer position-relative overflow-hidden"
                  style={{ height: "110px" }}
                  onClick={() => oilMeterRef.current.click()}
                >
                  <input
                    type="file"
                    hidden
                    ref={oilMeterRef}
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleImageUpload(e, "oilMeter")}
                  />
                  {form.oilMeterPreview ? (
                    <img
                      src={form.oilMeterPreview}
                      alt="Oil"
                      className="w-100 h-100 object-fit-cover rounded-3"
                    />
                  ) : (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                      <Droplets size={24} className="mb-1 text-warning" />
                      <span
                        className="small fw-bold"
                        style={{ fontSize: "0.75rem" }}
                      >
                        Oil Meter
                      </span>
                      <span
                        className="x-small text-secondary opacity-75"
                        style={{ fontSize: "0.65rem" }}
                      >
                        Tap to capture
                      </span>
                    </div>
                  )}
                  {form.oilMeterPreview && (
                    <div className="position-absolute bottom-0 end-0 bg-white p-1 rounded-top-start-3">
                      <Camera size={12} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 3. Payment Options */}
          {/* 3. Payment Options (Segmented Control Style) */}
          <div className="card border-0 shadow-sm rounded-4 p-3 bg-white">
            <h6 className="fw-bold text-primary text-uppercase small mb-3 ls-1">
              Payment Method
            </h6>

            {/* Premium Segmented Control */}
            <div className="bg-light p-1 rounded-pill d-flex position-relative mb-3 border">
              {/* Cash Option */}
              <div
                onClick={() => setForm({ ...form, paymentMode: "Cash" })}
                className={`flex-grow-1 text-center py-3 rounded-pill cursor-pointer d-flex align-items-center justify-content-center gap-2 transition-all ${
                  form.paymentMode === "Cash"
                    ? "bg-white shadow-sm text-success fw-bold"
                    : "text-muted fw-medium"
                }`}
              >
                <Banknote size={20} />
                <span style={{ fontSize: "0.9rem" }}>Cash</span>
                {form.paymentMode === "Cash" && (
                  <CheckCircle size={16} className="text-success ms-1" />
                )}
              </div>

              {/* Company Option */}
              <div
                onClick={() => setForm({ ...form, paymentMode: "Company" })}
                className={`flex-grow-1 text-center py-3 rounded-pill cursor-pointer d-flex align-items-center justify-content-center gap-2 transition-all ${
                  form.paymentMode === "Company"
                    ? "bg-white shadow-sm text-primary fw-bold"
                    : "text-muted fw-medium"
                }`}
              >
                <CreditCard size={20} />
                <span style={{ fontSize: "0.9rem" }}>Company</span>
                {form.paymentMode === "Company" && (
                  <CheckCircle size={16} className="text-primary ms-1" />
                )}
              </div>
            </div>

            {/* Conditional Input with smooth fade-in */}
            {form.paymentMode === "Company" && (
              <div className="animate-fade-in mt-2">
                <div className="form-floating">
                  <input
                    type="text"
                    className="form-control fw-bold border-0 bg-light rounded-4 text-primary"
                    id="paymentRef"
                    name="paymentRef"
                    placeholder="Ref No"
                    value={form.paymentRef}
                    onChange={handleInputChange}
                  />
                  <label
                    htmlFor="paymentRef"
                    className="text-secondary fw-bold"
                  >
                    <Hash size={16} className="me-1" />Payment Reference No.
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* 4. Receipt Upload (Main) */}
          <div
            className="card border-0 shadow-sm rounded-4 p-1 bg-white overflow-hidden"
            onClick={() => !compressing && receiptRef.current.click()}
          >
            <input
              type="file"
              hidden
              ref={receiptRef}
              accept="image/*"
              capture="environment"
              onChange={(e) => handleImageUpload(e, "receipt")}
            />
            {form.receiptPreview ? (
              <div className="position-relative">
                <img
                  src={form.receiptPreview}
                  alt="Receipt"
                  className="img-fluid object-fit-cover"
                  style={{ height: "180px", width: "100%" }}
                />
                <div className="position-absolute bottom-0 w-100 p-3 bg-gradient-to-t from-black text-white text-center">
                  <small className="fw-bold">
                    <Camera size={16} className="me-1" /> Tap to retake photo
                  </small>
                </div>
              </div>
            ) : (
              <div className="py-5 bg-light d-flex flex-column align-items-center justify-content-center cursor-pointer hover-bg-gray">
                {compressing ? (
                  <div className="spinner-border text-primary mb-3"></div>
                ) : (
                  <div className="bg-white p-3 rounded-circle shadow-sm mb-3">
                    <Camera size={32} className="text-primary" />
                  </div>
                )}
                <span className="fw-bold text-dark fs-5">
                  {compressing ? "Compressing..." : "Upload Bill Photo"}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || compressing}
            className="btn btn-primary btn-lg rounded-pill fw-bold shadow-lg py-2 mt-2 d-flex align-items-center justify-content-center gap-2"
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" />
            ) : (
              <>
                <UploadCloud size={22} /> SAVE REFUELING
              </>
            )}
          </button>
        </form>

        {/* --- HISTORY LIST SECTION --- */}
        <div className="mt-5 mb-5">
          <div className="d-flex align-items-center justify-content-between mb-3 px-1">
            <h5 className="fw-bold text-info mb-0 d-flex align-items-center gap-2">
              <History size={20} /> Recent Logs
            </h5>
           
          </div>

          {historyLoading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary"></div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-5 text-muted opacity-50">
              No history available
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  onClick={() => setSelectedLog(log)}
                  className="card border-0 shadow-sm rounded-4 p-3 bg-white active-scale-down cursor-pointer position-relative overflow-hidden"
                >
                  <div
                    className={`position-absolute top-0 bottom-0 start-0 w-1 ${
                      log.status === "Approved" ? "bg-success" : "bg-warning"
                    }`}
                    style={{ width: "6px" }}
                  ></div>
                  <div className="d-flex align-items-center justify-content-between ps-2">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                          log.status === "Approved"
                            ? "bg-success-subtle text-success"
                            : "bg-warning-subtle text-warning"
                        }`}
                        style={{ width: "45px", height: "45px" }}
                      >
                        <Fuel size={20} />
                      </div>
                      <div>
                        <h6
                          className="fw-bold mb-0 text-dark text-truncate"
                          style={{ maxWidth: "160px" }}
                        >
                          {log.station_name}
                        </h6>
                        <small
                          className="text-muted d-flex align-items-center gap-1"
                          style={{ fontSize: "0.75rem" }}
                        >
                          {new Date(log.created_at).toLocaleDateString(
                            "en-GB",
                            { day: "2-digit", month: "short" }
                          )}
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                      <h6 className="fw-bold mb-0 text-dark">
                        ₹{log.total_amount}
                      </h6>
                      <span
                        className={`badge rounded-pill ${
                          log.status === "Approved"
                            ? "bg-success-subtle text-success"
                            : "bg-warning-subtle text-warning-emphasis"
                        }`}
                        style={{ fontSize: "0.65rem" }}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ============ TRANSACTION DETAILS MODAL ============ */}
      {selectedLog && (
        <div
          className="modal-overlay"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 9990,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            backdropFilter: "blur(3px)",
          }}
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white w-100 shadow-lg animate-slide-up"
            style={{
              maxWidth: "500px",
              maxHeight: "90vh",
              overflowY: "auto",
              borderTopLeftRadius: "24px",
              borderTopRightRadius: "24px",
              position: "relative",
              zIndex: 9995,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-center pt-3 pb-2">
              <div
                className="bg-secondary opacity-25 rounded-pill"
                style={{ width: "40px", height: "4px" }}
              ></div>
            </div>

            {/* Header */}
            <div className="px-4 pb-3 d-flex justify-content-between align-items-center">
              <div>
                <h5 className="fw-bold mb-0 text-dark">Transaction Details</h5>
                <small className="text-dark">Trip Expense</small>
              </div>
              <button
                className="btn btn-light rounded-circle p-2"
                onClick={() => setSelectedLog(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-4 pb-4">
              {/* Hero Card */}
              <div
                className="p-4 rounded-4 mb-4 text-white shadow-sm position-relative overflow-hidden"
                style={{
                  background:
                    "linear-gradient(135deg, #10636e 0%, #2b2183 100%)",
                }}
              >
                <div className="d-flex justify-content-between align-items-start position-relative z-1">
                  <div>
                    <span className="opacity-75 small fw-bold">TOTAL</span>
                    <h1 className="display-5 fw-bold mb-0 mt-1">
                      ₹{selectedLog.total_amount}
                    </h1>
                  </div>
                  <span
                    className={`badge rounded-pill px-3 py-2 border ${
                      selectedLog.status === "Approved"
                        ? "bg-success text-white border-success"
                        : "bg-warning text-dark border-warning"
                    }`}
                  >
                    {selectedLog.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="bg-light rounded-4 p-3 mb-4 border">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block fw-bold small">
                      STATION NAME
                    </small>
                    <span className="fw-bold text-dark">
                      {selectedLog.station_name}
                    </span>
                  </div>
                 <div className="col-6">
                      <small className="text-muted d-block fw-bold small text-uppercase ls-1 mb-1">
                        Date & Time
                      </small>
                      
                      <div className="d-flex flex-column">
                        {/* Date: */}
                        <span className="fw-bolder text-dark fs-6">
                          {new Date(selectedLog.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        
                        {/* Time: */}
                        <span className="text-dark small fw-semibold">
                          {new Date(selectedLog.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                    </div>
                  <div className="col-6">
                    <small className="text-muted d-block fw-bold small">
                      VOLUME
                    </small>
                    <span className="fw-bold text-dark">
                      {selectedLog.liters} L
                    </span>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block fw-bold small">
                      PRICE/L
                    </small>
                    <span className="fw-bold text-dark">
                      ₹{selectedLog.price_per_liter}
                    </span>
                  </div>
                </div>
              </div>

              {/* 3 IMAGE GRID IN MODAL */}
              <h6 className="fw-bold text-primary small mb-3 ls-1">
                SNAPSHOTS (Tap to View)
              </h6>
              <div className="row g-2">
                {/* Receipt */}
                <div className="col-4">
                  <div
                    className="ratio ratio-1x1 rounded-3 overflow-hidden border cursor-pointer bg-light"
                    onClick={() =>
                      setFullImage(getImageUrl(selectedLog.receipt_image))
                    }
                  >
                    <img
                      src={getImageUrl(selectedLog.receipt_image)}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/200?text=No+Img")
                      }
                      alt="Bill"
                    />
                    <div className="position-absolute bottom-0 start-0 w-100 bg-black bg-opacity-50 text-white text-center">
                      <small style={{ fontSize: "9px" }}>BILL</small>
                    </div>
                  </div>
                </div>
                {/* Fuel Meter */}
                <div className="col-4">
                  <div
                    className="ratio ratio-1x1 rounded-3 overflow-hidden border cursor-pointer bg-light"
                    onClick={() =>
                      setFullImage(getImageUrl(selectedLog.fuel_meter_image))
                    }
                  >
                    <img
                      src={getImageUrl(selectedLog.fuel_meter_image)}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/200?text=No+Img")
                      }
                      alt="Fuel"
                    />
                    <div className="position-absolute bottom-0 start-0 w-100 bg-black bg-opacity-50 text-white text-center">
                      <small style={{ fontSize: "9px" }}>FUEL</small>
                    </div>
                  </div>
                </div>
                {/* Oil Meter */}
                <div className="col-4">
                  <div
                    className="ratio ratio-1x1 rounded-3 overflow-hidden border cursor-pointer bg-light"
                    onClick={() =>
                      setFullImage(getImageUrl(selectedLog.oil_meter_image))
                    }
                  >
                    <img
                      src={getImageUrl(selectedLog.oil_meter_image)}
                      className="w-100 h-100 object-fit-cover"
                      onError={(e) =>
                        (e.target.src = "https://placehold.co/200?text=No+Img")
                      }
                      alt="Oil"
                    />
                    <div className="position-absolute bottom-0 start-0 w-100 bg-black bg-opacity-50 text-white text-center">
                      <small style={{ fontSize: "9px" }}>OIL</small>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  className="btn btn-dark w-100 rounded-pill py-3 fw-bold"
                  onClick={() => setSelectedLog(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============ FULL SCREEN IMAGE LIGHTBOX ============ */}
      {fullImage && (
        <div
          className="fixed-top w-100 h-100 bg-black d-flex align-items-center justify-content-center p-0"
          style={{ zIndex: 10000 }}
          onClick={() => setFullImage(null)}
        >
          <button
            className="position-absolute top-0 end-0 m-4 btn btn-dark rounded-circle p-3 z-3 bg-opacity-50 border-0"
            onClick={() => setFullImage(null)}
          >
            <X size={24} className="text-white" />
          </button>
          <img
            src={fullImage}
            alt="Full View"
            className="img-fluid"
            style={{
              maxHeight: "100vh",
              maxWidth: "100vw",
              objectFit: "contain",
            }}
          />
        </div>
      )}

      <style>{`
        .ls-1 { letter-spacing: 1px; }
        .cursor-pointer { cursor: pointer; }
        .transition-all { transition: all 0.2s ease; }
        .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default RefuelPage;