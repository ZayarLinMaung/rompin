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
    unitNumber: "",
    type: "",
    lotNo: "",
    builtUpArea: "",
    facing: "",
    spaPrice: "",
    totalCarParks: "",
    status: "available",
  });

  useEffect(() => {
    if (unit) {
      setFormData({
        unitNumber: unit.unitNumber || "",
        type: unit.type || "",
        lotNo: unit.lotNo || "",
        builtUpArea: unit.builtUpArea || "",
        facing: unit.facing || "",
        spaPrice: unit.spaPrice || "",
        totalCarParks: unit.totalCarParks || "",
        status: unit.status || "available",
      });
    }
  }, [unit]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = {
      ...formData,
      status: formData.status,
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
          <div className="form-group">
            <label htmlFor="unitNumber">Unit Number</label>
            <input
              type="text"
              id="unitNumber"
              name="unitNumber"
              value={formData.unitNumber}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Select Type</option>
              <option value="B1">B1</option>
              <option value="B">B</option>
              <option value="C1">C1</option>
              <option value="C">C</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="lotNo">Lot No</label>
            <input
              type="text"
              id="lotNo"
              name="lotNo"
              value={formData.lotNo}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="builtUpArea">Built-up Area (sq ft)</label>
            <input
              type="number"
              id="builtUpArea"
              name="builtUpArea"
              value={formData.builtUpArea}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="facing">Facing</label>
            <select
              id="facing"
              name="facing"
              value={formData.facing}
              onChange={handleChange}
              required
            >
              <option value="">Select Facing</option>
              <option value="Lake View">Lake View</option>
              <option value="Facility View North">Facility View North</option>
              <option value="Facility View East">Facility View East</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="spaPrice">Price (RM)</label>
            <input
              type="number"
              id="spaPrice"
              name="spaPrice"
              value={formData.spaPrice}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="totalCarParks">Total Car Parks</label>
            <input
              type="number"
              id="totalCarParks"
              name="totalCarParks"
              value={formData.totalCarParks}
              onChange={handleChange}
              required
            />
          </div>

          {isAdmin && (
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="booked">Booked</option>
              </select>
            </div>
          )}

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
