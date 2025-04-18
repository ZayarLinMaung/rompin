import React, { useState, useCallback, useEffect } from "react";
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
    console.log("ReservationForm rendered with unit:", unit);
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
      e.preventDefault();
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
          agencyName: formData.agencyName,
          agentName: formData.agentName,
          name: formData.name,
          ic: formData.ic,
          contact: formData.contact,
          address: formData.address
        };

        console.log('Submitting reservation with data:', reservationData);

        // Create the reservation
        const reservationResponse = await axios.post(
          `http://localhost:5000/api/units/${unit._id}/reserve`,
          reservationData,
          { 
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            } 
          }
        );

        console.log('Reservation response:', reservationResponse.data);

        // Handle file uploads if present
        if (files.icSoftcopy || files.proofOfPayment) {
          const formDataWithFiles = new FormData();
          if (files.icSoftcopy)
            formDataWithFiles.append("icSoftcopy", files.icSoftcopy);
          if (files.proofOfPayment)
            formDataWithFiles.append("proofOfPayment", files.proofOfPayment);

          console.log('Uploading files...');
          
          // Use the booking ID from the reservation response for file upload
          const bookingId = reservationResponse.data.booking._id;
          await axios.post(
            `http://localhost:5000/api/bookings/${bookingId}/files`,
            formDataWithFiles,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            }
          );
        }

        console.log('Reservation completed successfully');
        onSuccess(reservationResponse.data);
        onClose();
      } catch (err) {
        console.error("Error submitting reservation:", err);
        setErrors({
          submit:
            err.response?.data?.message || "Failed to submit reservation. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [validateForm, formData, files, unit, onClose, onSuccess]
  );

  // Handle clicking outside the modal to close
  const handleOverlayClick = (e) => {
    if (e.target.className === 'modal-overlay') {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>Book Unit {unit.unitNumber}</h2>
          <button className="close-button" onClick={onClose}>&times;</button>
        </div>
        
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-section">
            <h3 className="form-section-title">Unit Details</h3>
            <div className="form-row">
              <label>Unit Number</label>
              <p>{unit.unitNumber}</p>
              <label>Type</label>
              <p>{unit.type}</p>
              <label>Status</label>
              <p>{unit.status}</p>
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Agency Information</h3>
            <div className="form-row">
              <label htmlFor="agencyName">Agency Name</label>
              <input
                type="text"
                id="agencyName"
                name="agencyName"
                value={formData.agencyName}
                onChange={handleInputChange}
                className={errors.agencyName ? "error" : ""}
              />
              {errors.agencyName && (
                <span className="error-message">{errors.agencyName}</span>
              )}
            </div>

            <div className="form-row">
              <label htmlFor="agentName">Agent Name</label>
              <input
                type="text"
                id="agentName"
                name="agentName"
                value={formData.agentName}
                onChange={handleInputChange}
                className={errors.agentName ? "error" : ""}
              />
              {errors.agentName && (
                <span className="error-message">{errors.agentName}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Personal Information</h3>
            <div className="form-row">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={errors.name ? "error" : ""}
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="form-row">
              <label htmlFor="ic">IC Number</label>
              <input
                type="text"
                id="ic"
                name="ic"
                value={formData.ic}
                onChange={handleInputChange}
                className={errors.ic ? "error" : ""}
              />
              {errors.ic && <span className="error-message">{errors.ic}</span>}
            </div>

            <div className="form-row">
              <label htmlFor="contact">Contact Number</label>
              <input
                type="tel"
                id="contact"
                name="contact"
                value={formData.contact}
                onChange={handleInputChange}
                className={errors.contact ? "error" : ""}
              />
              {errors.contact && (
                <span className="error-message">{errors.contact}</span>
              )}
            </div>

            <div className="form-row">
              <label htmlFor="address">Address</label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className={errors.address ? "error" : ""}
              />
              {errors.address && (
                <span className="error-message">{errors.address}</span>
              )}
            </div>
          </div>

          <div className="form-section">
            <h3 className="form-section-title">Required Documents</h3>
            <div className="form-row">
              <label htmlFor="icSoftcopy">IC Softcopy</label>
              <input
                type="file"
                id="icSoftcopy"
                name="icSoftcopy"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
              {errors.icSoftcopy && (
                <span className="error-message">{errors.icSoftcopy}</span>
              )}
              <span className="helper-text">Upload a clear copy of your IC (PDF or image)</span>
            </div>

            <div className="form-row">
              <label htmlFor="proofOfPayment">Proof of Payment</label>
              <input
                type="file"
                id="proofOfPayment"
                name="proofOfPayment"
                onChange={handleFileChange}
                accept="image/*,.pdf"
              />
              {errors.proofOfPayment && (
                <span className="error-message">{errors.proofOfPayment}</span>
              )}
              <span className="helper-text">Upload your payment receipt (PDF or image)</span>
            </div>
          </div>

          {errors.submit && (
            <div className="submit-error">{errors.submit}</div>
          )}

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(ReservationForm, areEqual);
