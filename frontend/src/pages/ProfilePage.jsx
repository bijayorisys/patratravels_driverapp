import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Mail,
  MapPin,
  Globe,
  Loader2,
  Smartphone,
  Save,
  Hash,
  Edit2,
  CheckCircle2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import imageCompression from "browser-image-compression";
import api, { IMAGE_BASE_URL } from "../api/Api.js";

const ProfilePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Address Edit State
  const [editableFields, setEditableFields] = useState({
    zipcode: false,
    address1: false,
    address2: false,
    address3: false,
  });

  // Modal & OTP State
  const [modalType, setModalType] = useState(null);
  const [tempValue, setTempValue] = useState("");
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);

  // Data State
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [preview, setPreview] = useState(null);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    utype: "",
    address1: "",
    address2: "",
    address3: "",
    country_id: "99",
    state_id: "",
    city_id: "",
    zipcode: "",
    photo: null,
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [profileRes, statesRes] = await Promise.all([
        api.get("/auth/profile"),
        api.get("/auth/geo/states"),
      ]);

      const p = profileRes.data.success ? profileRes.data : profileRes.data;
      const initialStates = statesRes.data.data || [];
      setStates(initialStates);

      setFormData({
        fullName: p.fullName || "",
        driverId: p.driverId || "",
        email: p.email || "",
        phone: p.phone || "",
        utype: p.utype || "",
        address1: p.address1 || "",
        address2: p.address2 || "",
        address3: p.address3 || "",
        country_id: "99",
        state_id: p.state_id || "",
        city_id: p.city_id || "",
        zipcode: p.zipcode || "",
        photo: null,
      });

      if (p.state_id) {
        const citiesRes = await api.get(
          `/auth/geo/cities?stateCode=${p.state_id}`
        );
        setCities(citiesRes.data.data || []);
      }

      if (p.driver_photo) {
        const sanitizedPath = p.driver_photo.startsWith("/")
          ? p.driver_photo
          : `/${p.driver_photo}`;
        setPreview(`${IMAGE_BASE_URL}${sanitizedPath}`);
      }
    } catch (err) {
      console.error("Profile load error:", err);
      toast.error("Error loading profile");
    } finally {
      setLoading(false);
    }
  };

  const toggleEdit = (field) => {
    setEditableFields((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleStateChange = async (e) => {
    const selectedStateCode = e.target.value;
    setFormData((prev) => ({
      ...prev,
      state_id: selectedStateCode,
      city_id: "",
    }));

    if (selectedStateCode) {
      try {
        const res = await api.get(
          `/auth/geo/cities?stateCode=${selectedStateCode}`
        );
        setCities(res.data.data || []);
      } catch (err) {
        toast.error("Failed to load cities");
      }
    } else {
      setCities([]);
    }
  };

  // --- SILENT COMPRESSION (Frontend) ---
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Check Input Size (5MB Limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image too large. Max size is 5MB.");
      return;
    }

    // 2. Compress Image Silently (No Toast)
    const options = {
      maxSizeMB: 0.1, // Target: ~100KB
      maxWidthOrHeight: 800,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      // Update State immediately
      setFormData((prev) => ({ ...prev, photo: compressedFile }));
      setPreview(URL.createObjectURL(compressedFile));
    } catch (error) {
      console.error("Compression Error:", error);
      // Fallback: use original file if compression fails
      setFormData((prev) => ({ ...prev, photo: file }));
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    navigator.vibrate?.(60);

    setUpdating(true);

    // A. Native loading dialog
    Swal.fire({
      title: "Updating Profile...",
      html: `
      <div style="font-size:14px;color:#666">
        Syncing your details<br/>
        Please wait...
      </div>
    `,
      allowOutsideClick: false,
      showConfirmButton: false,
      background: "#f0f7ff",
      color: "#2563eb",
      customClass: { popup: "swal2-rounded" },
      didOpen: () => Swal.showLoading(),
    });

    const data = new FormData();

    Object.keys(formData).forEach((key) => {
      if (key === "photo") {
        if (formData.photo) data.append("photo", formData.photo);
      } else {
        data.append(key, formData[key] || "");
      }
    });

    try {
      const res = await api.put("/auth/update-complete-profile", data);

      navigator.vibrate?.(120);

      // B. Native success alert
      await Swal.fire({
        icon: "success",
        title: "✅ Profile Updated",
        text: res.data?.message || "Your profile saved successfully",
        background: "#f0fdf4",
        timer: 1600,
        showConfirmButton: false,
        customClass: { popup: "swal2-rounded" },
      });

      setEditableFields({
        zipcode: false,
        address1: false,
        address2: false,
        address3: false,
      });

      // C. Smooth navigation
      setUpdating(false);
      navigate("/dashboard");
    } catch (e) {
      navigator.vibrate?.(200);

      console.error("Profile update error:", e);

      // D. Native error card
      await Swal.fire({
        icon: "error",
        title: "⚠ Update Failed",
        html: `
        <div style="font-size:14px">
          ${
            e.response?.data?.message ||
            "Unable to update profile. Please try again."
          }
        </div>
      `,
        background: "#fff1f2",
        timer: 2000,
        showConfirmButton: false,
        customClass: { popup: "swal2-rounded" },
      });

      setUpdating(false);
    }
  };

  const handleRequestOtp = async () => {
    if (!tempValue) return toast.error(`Enter valid ${modalType}`);
    setOtpLoading(true);
    try {
      const endpoint =
        modalType === "phone"
          ? "/auth/request-phone-change"
          : "/auth/request-email-change";
      const payload =
        modalType === "phone"
          ? { newMobileNumber: tempValue }
          : { newEmail: tempValue };
      const res = await api.post(endpoint, payload);

      if (res.data.dev_otp)
        toast(`Dev OTP: ${res.data.dev_otp}`, { icon: "🔑" });
      setOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpValue.length !== 4) return toast.error("Enter 4-digit OTP");
    setOtpLoading(true);
    try {
      const endpoint =
        modalType === "phone"
          ? "/auth/verify-phone-change"
          : "/auth/verify-email-change";
      const payload =
        modalType === "phone"
          ? { newMobileNumber: tempValue, otp: otpValue }
          : { newEmail: tempValue, otp: otpValue };
      await api.post(endpoint, payload);

      setFormData((prev) => ({
        ...prev,
        [modalType === "phone" ? "phone" : "email"]: tempValue,
      }));
      toast.success(`${modalType === "phone" ? "Phone" : "Email"} updated!`);
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid OTP");
    } finally {
      setOtpLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setTempValue("");
    setOtpValue("");
    setOtpSent(false);
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-white">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container-fluid py-2 bg-white min-vh-100"
      style={{ paddingBottom: "10px" }}
    >
      <div className="mx-auto" style={{ maxWidth: "600px" }}>
        {/* --- 1. PREMIUM AVATAR CARD --- */}
        <div className="card border-0 shadow-sm rounded-4 mb-3 overflow-hidden">
          <div className="card-body p-3 text-center position-relative">
            {/* --- Profile Image Section --- */}
            <div className="position-relative d-inline-block mb-2">
              {/* Avatar Container */}
              <div
                className="rounded-circle shadow-sm border border-2 border-info overflow-hidden d-flex align-items-center justify-content-center bg-light"
                style={{ width: "110px", height: "110px" }} // Only necessary inline style for size
              >
                {preview ? (
                  <img
                    src={preview}
                    alt="Profile"
                    className="w-100 h-100 object-fit-cover"
                  />
                ) : (
                  <span className="display-4 fw-bold text-primary opacity-50">
                    {formData.fullName
                      ? formData.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </span>
                )}
              </div>

              {/* Camera/Edit FAB (Floating Action Button) */}
              <label
                htmlFor="photo"
                className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 border border-2 border-white d-flex align-items-center justify-content-center shadow-sm"
                style={{ width: "35px", height: "35px" }}
              >
                <Camera size={16} />
                <input
                  id="photo"
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handlePhotoChange}
                />
              </label>
            </div>

            {/* --- Text Info --- */}
            <div className="mt-2">
              <h5 className="fw-bold text-dark mb-1">
                {formData.fullName || "Driver Name"}
              </h5>

              <p className="small text-dark mb-2 fw-medium">
                {formData.driverId || "ID: --"} &bull;{" "}
                {formData.phone || "+91 --"}
              </p>

              {/* --- Native Pill Badge --- */}
              <div className="d-inline-flex align-items-center bg-success bg-opacity-10 text-success rounded-pill px-3 py-1 small fw-bold">
                <span className="me-1">✓</span> Verified Driver
              </div>
            </div>
          </div>
        </div>

        {/* --- 2. PERSONAL INFO --- */}
        <h6 className="text-primary fw-bold text-uppercase small px-3 mb-3 d-flex align-items-center gap-2">
          <User size={16} /> Personal Information
        </h6>

        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
          <div className="card-body p-0">
            {/* Phone */}
            <div className="d-flex align-items-center p-3 border-bottom hover-bg-gray transition-all">
              {/* Icon - Fixed Size */}
              <div className="bg-blue-50 p-2 rounded-circle me-3 text-primary flex-shrink-0">
                <Smartphone size={22} />
              </div>

              {/* Content - Grow to fill space */}
              <div
                className="flex-grow-1 overflow-hidden me-2"
                style={{ minWidth: 0 }}
              >
                <label className="d-block text-xs text-muted fw-bold mb-0 text-uppercase">
                  Mobile Number
                </label>
                <div className="fw-bold text-dark fs-6 text-truncate">
                  {formData.phone || "---"}
                </div>
              </div>

              {/* Button - Fixed Size */}
              <button
                className="btn btn-outline-primary btn-sm fw-bold rounded-pill px-3 flex-shrink-0"
                onClick={() => {
                  setModalType("phone");
                  setTempValue(formData.phone);
                }}
              >
                Change
              </button>
            </div>

            {/* Email */}
            <div className="d-flex align-items-center p-3 hover-bg-gray transition-all">
              {/* Icon */}
              <div className="bg-blue-50 p-2 rounded-circle me-3 text-primary flex-shrink-0">
                <Mail size={22} />
              </div>

              {/* Content - Responsive Truncation */}
              <div
                className="flex-grow-1 overflow-hidden me-2"
                style={{ minWidth: 0 }}
              >
                <label className="d-block text-xs text-muted fw-bold mb-0 text-uppercase">
                  Email Address
                </label>
                <div
                  className="fw-bold text-dark fs-6 text-truncate"
                  title={formData.email}
                >
                  {formData.email || "---"}
                </div>
              </div>

              {/* Button */}
              <button
                className="btn btn-outline-primary btn-sm fw-bold rounded-pill px-3 flex-shrink-0"
                onClick={() => {
                  setModalType("email");
                  setTempValue(formData.email);
                }}
              >
                Update
              </button>
            </div>
          </div>
        </div>

        {/* --- 3. ADDRESS DETAILS --- */}
        <h6 className="text-primary fw-bold text-uppercase small px-3 mb-3 d-flex align-items-center gap-2">
          <MapPin size={16} /> Address Details
        </h6>

        <div className="card border-0 shadow-sm rounded-4 mb-4">
          <div className="card-body p-4">
            <div className="row g-4">
              {/* State */}
              <div className="col-12">
                <label className="small text-muted fw-bold mb-1 text-uppercase">
                  State
                </label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text border-0 bg-white ps-3">
                    <Globe size={18} className="text-primary" />
                  </span>
                  <select
                    className="form-select border-0 fw-semibold bg-white py-2"
                    value={formData.state_id}
                    onChange={handleStateChange}
                  >
                    <option value="">Select State</option>
                    {states.map((s) => (
                      <option key={s.state_id} value={s.state_id}>
                        {s.state_name || s.state}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* City */}
              <div className="col-12">
                <label className="small text-muted fw-bold mb-1 text-uppercase">
                  City
                </label>
                <div className="input-group shadow-sm rounded-3 overflow-hidden">
                  <span className="input-group-text border-0 bg-white ps-3">
                    <MapPin size={18} className="text-primary" />
                  </span>
                  <select
                    className="form-select border-0 fw-semibold bg-white py-2"
                    value={formData.city_id}
                    onChange={(e) =>
                      setFormData({ ...formData, city_id: e.target.value })
                    }
                  >
                    <option value="">Select City</option>
                    {cities.map((c) => (
                      <option key={c.city_id} value={c.city_id}>
                        {c.city_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Zipcode */}
              <div className="col-12">
                <label className="small text-muted fw-bold mb-1 text-uppercase">
                  Zipcode
                </label>
                <div
                  className={`input-group shadow-sm rounded-3 overflow-hidden ${
                    editableFields.zipcode
                      ? "border border-primary"
                      : "border-0"
                  }`}
                >
                  <span className="input-group-text border-0 bg-white ps-3">
                    <Hash size={18} className="text-primary" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    className="form-control border-0 fw-semibold bg-white py-2"
                    placeholder="6-digit Zipcode"
                    value={formData.zipcode}
                    onChange={(e) =>
                      /^\d*$/.test(e.target.value) &&
                      e.target.value.length <= 6 &&
                      setFormData({ ...formData, zipcode: e.target.value })
                    }
                    disabled={!editableFields.zipcode}
                  />
                  <button
                    className="btn bg-white border-0 text-primary pe-3"
                    type="button"
                    onClick={() => toggleEdit("zipcode")}
                  >
                    {editableFields.zipcode ? (
                      <CheckCircle2 size={20} className="text-success" />
                    ) : (
                      <Edit2 size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* Address Lines */}
              {[
                {
                  label: "Address Line 1",
                  key: "address1",
                  placeholder: "House/Flat No",
                },
                {
                  label: "Address Line 2",
                  key: "address2",
                  placeholder: "Street/Locality",
                },
                {
                  label: "Address Line 3",
                  key: "address3",
                  placeholder: "Landmark",
                },
              ].map((field) => (
                <div className="col-12" key={field.key}>
                  <label className="small text-muted fw-bold mb-1 text-uppercase">
                    {field.label}
                  </label>
                  <div
                    className={`input-group shadow-sm rounded-3 overflow-hidden ${
                      editableFields[field.key]
                        ? "border border-primary"
                        : "border-0"
                    }`}
                  >
                    <input
                      type="text"
                      className="form-control border-0 fw-semibold bg-white py-2 ps-3"
                      placeholder={field.placeholder}
                      value={formData[field.key]}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.key]: e.target.value,
                        })
                      }
                      disabled={!editableFields[field.key]}
                    />
                    <button
                      className="btn bg-white border-0 text-primary pe-3"
                      type="button"
                      onClick={() => toggleEdit(field.key)}
                    >
                      {editableFields[field.key] ? (
                        <CheckCircle2 size={20} className="text-success" />
                      ) : (
                        <Edit2 size={18} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. SAVE BUTTON */}
        <button
          className="btn btn-primary w-100 py-2 rounded-4 fw-bold shadow-lg d-flex align-items-center justify-content-center mt-2 mb-4"
          onClick={handleSaveProfile}
          disabled={updating}
          style={{ height: "54px", fontSize: "1.1rem" }}
        >
          {updating ? (
            <Loader2 className="spinner-border spinner-border-sm me-2" />
          ) : (
            <Save size={20} className="me-2" />
          )}
          UPDATE PROFILE
        </button>
      </div>

      {/* --- 5. OTP MODAL --- */}
      {modalType && (
        <div
          className="modal show d-block fade"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              <div className="modal-body p-4 text-center">
                <h5 className="fw-bold mb-4 text-dark">
                  Update{" "}
                  {modalType === "phone" ? "Phone Number" : "Email Address"}
                </h5>

                {!otpSent ? (
                  <>
                    <div className="form-floating mb-3">
                      <input
                        type={modalType === "phone" ? "tel" : "email"}
                        inputMode={modalType === "phone" ? "numeric" : "email"}
                        className="form-control bg-light border-0 shadow-inner"
                        id="newValueInput"
                        placeholder={`New ${modalType}`}
                        value={tempValue}
                        onChange={(e) => {
                          if (modalType === "phone") {
                            if (/^\d*$/.test(e.target.value))
                              setTempValue(e.target.value);
                          } else {
                            setTempValue(e.target.value);
                          }
                        }}
                      />
                      <label htmlFor="newValueInput">
                        New {modalType === "phone" ? "Phone" : "Email"}
                      </label>
                    </div>
                    <button
                      className="btn btn-primary w-100 py-3 rounded-3 fw-bold mb-2 shadow-sm"
                      onClick={handleRequestOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? "Sending..." : "SEND OTP"}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mb-4">
                      <input
                        type="text"
                        inputMode="numeric"
                        className="form-control form-control-lg text-center fw-bold letter-spacing-2 bg-light border-0 shadow-inner"
                        maxLength={4}
                        placeholder="0 0 0 0"
                        value={otpValue}
                        onChange={(e) => {
                          if (/^\d*$/.test(e.target.value))
                            setOtpValue(e.target.value);
                        }}
                        style={{
                          letterSpacing: "14px",
                          fontSize: "28px",
                          height: "60px",
                        }}
                      />
                      <small className="text-muted mt-2 d-block">
                        Enter the 4-digit code sent to you
                      </small>
                    </div>
                    <button
                      className="btn btn-success w-100 py-3 rounded-3 fw-bold mb-2 shadow-sm"
                      onClick={handleVerifyOtp}
                      disabled={otpLoading}
                    >
                      {otpLoading ? "Verifying..." : "VERIFY & UPDATE"}
                    </button>
                  </>
                )}

                <button
                  className="btn btn-link text-secondary text-decoration-none fw-semibold mt-2"
                  onClick={closeModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for extra polish */}
      <style>{`
        .bg-blue-50 { background-color: #f0f7ff; }
        .text-xs { font-size: 0.75rem; }
        .hover-bg-gray:hover { background-color: #f8f9fa; }
        .shadow-inner { box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.05); }
      `}</style>
    </div>
  );
};

export default ProfilePage;