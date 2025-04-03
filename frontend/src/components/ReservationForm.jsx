import React, { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import "./ReservationForm.css";

// Create an areEqual function for React.memo to control when re-renders happen
const areEqual = (prevProps, nextProps) => {
  // Only re-render if the unit ID changes
  return prevProps.unit?._id === nextProps.unit?._id;
};

const ReservationForm = ({ unit, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    agencyName: "",
    agentName: "",
    name: "",
    ic: "",
    contact: "",
    address: "",
  });

  const [files, setFiles] = useState({
    icSoftcopy: null,
    proofOfPayment: null,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log("ReservationForm rendered with props:", { unit });
  }, [unit]);

  const handleInputChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({
          ...prev,
          [name]: null,
        }));
      }
    },
    [errors]
  );

  const handleFileChange = useCallback(
    (e) => {
      const { name, files: fileList } = e.target;
      if (fileList.length > 0) {
        setFiles((prev) => ({
          ...prev,
          [name]: fileList[0],
        }));
        // Clear error when user selects a file
        if (errors[name]) {
          setErrors((prev) => ({
            ...prev,
            [name]: null,
          }));
        }
      }
    },
    [errors]
  );

  const validateForm = useCallback(() => {
    const newErrors = {};
    const requiredFields = [
      "agencyName",
      "agentName",
      "name",
      "ic",
      "contact",
      "address",
    ];

    requiredFields.forEach((field) => {
      if (!formData[field]) newErrors[field] = `${field} is required`;
    });

    if (!files.icSoftcopy) newErrors.icSoftcopy = "IC softcopy is required";
    if (!files.proofOfPayment)
      newErrors.proofOfPayment = "Proof of payment is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, files]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault(); // Prevents the form from reloading the page
      if (!validateForm()) return;

      setIsSubmitting(true);
      const token = localStorage.getItem("token");

      if (!token) {
        setErrors({ submit: "You must be logged in to make a reservation." });
        setIsSubmitting(false);
        return;
      }

      try {
        const reservationData = {
          unitId: unit._id,
          userId: JSON.parse(atob(token.split(".")[1])).id,
          ...formData,
          status: "pending", // Set initial status to pending
        };

        // Create the reservation
        const reservationResponse = await axios.put(
          `http://localhost:5000/api/units/${unit._id}/reserve`,
          reservationData,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Handle file uploads if present
        const formDataWithFiles = new FormData();
        if (files.icSoftcopy)
          formDataWithFiles.append("icSoftcopy", files.icSoftcopy);
        if (files.proofOfPayment)
          formDataWithFiles.append("proofOfPayment", files.proofOfPayment);

        await axios.post(
          `http://localhost:5000/api/units/${unit._id}/files`,
          formDataWithFiles,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          }
        );

        onSuccess(reservationResponse.data);
        onClose();
      } catch (err) {
        console.error("Error submitting reservation:", err);
        setErrors({
          submit:
            err.response?.data?.message || "Failed to submit reservation.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, formData, files, unit, onClose, onSuccess]
  );

  return (
    <form onSubmit={handleSubmit} className="reservation-form">
      <div className="form-section">
        <h4>Agency Information</h4>
        <div className="form-group">
          <label>Agency Name:</label>
          <input
            type="text"
            name="agencyName"
            value={formData.agencyName}
            onChange={handleInputChange}
            className={errors.agencyName ? "error" : ""}
          />
          {errors.agencyName && (
            <span className="error-text">{errors.agencyName}</span>
          )}
        </div>
        <div className="form-group">
          <label>Agent Name:</label>
          <input
            type="text"
            name="agentName"
            value={formData.agentName}
            onChange={handleInputChange}
            className={errors.agentName ? "error" : ""}
          />
          {errors.agentName && (
            <span className="error-text">{errors.agentName}</span>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Customer Information</h4>
        <div className="form-group">
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            className={errors.name ? "error" : ""}
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>
        <div className="form-group">
          <label>IC Number:</label>
          <input
            type="text"
            name="ic"
            value={formData.ic}
            onChange={handleInputChange}
            className={errors.ic ? "error" : ""}
          />
          {errors.ic && <span className="error-text">{errors.ic}</span>}
        </div>
        <div className="form-group">
          <label>Contact Number:</label>
          <input
            type="text"
            name="contact"
            value={formData.contact}
            onChange={handleInputChange}
            className={errors.contact ? "error" : ""}
          />
          {errors.contact && (
            <span className="error-text">{errors.contact}</span>
          )}
        </div>
        <div className="form-group">
          <label>Address:</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className={errors.address ? "error" : ""}
          />
          {errors.address && (
            <span className="error-text">{errors.address}</span>
          )}
        </div>
      </div>

      <div className="form-section">
        <h4>Required Documents</h4>
        <div className="form-group">
          <label>IC Softcopy:</label>
          <input
            type="file"
            name="icSoftcopy"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className={errors.icSoftcopy ? "error" : ""}
          />
          {errors.icSoftcopy && (
            <span className="error-text">{errors.icSoftcopy}</span>
          )}
        </div>
        <div className="form-group">
          <label>Proof of Payment:</label>
          <input
            type="file"
            name="proofOfPayment"
            onChange={handleFileChange}
            accept="image/*,.pdf"
            className={errors.proofOfPayment ? "error" : ""}
          />
          {errors.proofOfPayment && (
            <span className="error-text">{errors.proofOfPayment}</span>
          )}
        </div>
      </div>

      {errors.submit && <div className="error-message">{errors.submit}</div>}

      <div className="form-actions">
        <button type="button" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </button>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Reservation"}
        </button>
      </div>
    </form>
  );
};

// Export with memo and custom comparison function
export default React.memo(ReservationForm, areEqual);
