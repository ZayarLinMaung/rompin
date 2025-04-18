import React, { useState, useEffect } from "react";
import "./UnitModal.css";

const UnitModal = ({
  unit,
  onClose,
  onUpdate,
  onDelete,
  onCreate,
  isAdmin = false,
}) => {
  const [formData, setFormData] = useState({
    specifications: {
      unitNumber: "",
      builtUp: "",
      extraLand: "",
      landSize: "",
      bedrooms: "",
      bathrooms: ""
    },
    status: "PRESENT",
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        specifications: {
          unitNumber: unit.unitNumber || "",
          builtUp: unit.specifications?.builtUp || "20'x40'",
          extraLand: unit.specifications?.extraLand || "8'",
          landSize: unit.specifications?.landSize || "20'x70'",
          bedrooms: unit.specifications?.bedrooms || 3,
          bathrooms: unit.specifications?.bathrooms || 2
        },
        status: unit.status || "PRESENT",
      });
    }
  }, [unit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('specifications.')) {
      const specField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        specifications: {
          ...prev.specifications,
          [specField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = {
      ...formData,
      _id: unit?._id,
    };

    console.log("Submitting unit update:", updatedData);

    if (unit) {
      onUpdate(updatedData);
    } else {
      onCreate(updatedData);
    }
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this unit?")) {
      onDelete(unit._id);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="close-button" onClick={onClose}>
          ×
        </button>
        <h2>{unit ? "Edit Unit" : "Add New Unit"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-section">
            <h4>Specifications</h4>
            <div className="form-group">
              <label>Unit Number:</label>
              <input
                type="text"
                name="specifications.unitNumber"
                value={formData.specifications?.unitNumber || ""}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Built Up:</label>
              <input
                type="text"
                name="specifications.builtUp"
                value={formData.specifications?.builtUp || "20'x40'"}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Extra Land:</label>
              <input
                type="text"
                name="specifications.extraLand"
                value={formData.specifications?.extraLand || "8'"}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Land Size:</label>
              <input
                type="text"
                name="specifications.landSize"
                value={formData.specifications?.landSize || "20'x70'"}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Bedrooms:</label>
              <input
                type="number"
                name="specifications.bedrooms"
                value={formData.specifications?.bedrooms || 3}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Bathrooms:</label>
              <input
                type="number"
                name="specifications.bathrooms"
                value={formData.specifications?.bathrooms || 2}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Status:</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="PRESENT">Present</option>
              <option value="ADVISE">Advise</option>
              <option value="LA SIGNED">LA Signed</option>
              <option value="SPA SIGNED">SPA Signed</option>
              <option value="LOAN APPROVED">Loan Approved</option>
              <option value="PENDING BUYER DOC">Pending Buyer Doc</option>
              <option value="LANDOWNER UNIT">Landowner Unit</option>
              <option value="LOAN IN PROCESS">Loan in Process</option>
              <option value="NEW BOOK">New Book</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="submit" className="submit-btn">
              {unit ? "Update Unit" : "Create Unit"}
            </button>
            {unit && isAdmin && (
              <button
                type="button"
                className="delete-btn"
                onClick={handleDelete}
              >
                Delete Unit
              </button>
            )}
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UnitModal;
