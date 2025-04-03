import React from "react";
import "./UnitCard.css";

const UnitCard = ({ unit, onUnitClick, onBookingClick, isAdmin = false }) => {
  const getStatusClass = () => {
    const status = unit.status.toLowerCase();
    switch (status) {
      case "booked":
        return "booked";
      case "reserved":
        return "reserved";
      case "available":
        return "available";
      default:
        return "available";
    }
  };

  const getStatusText = () => {
    const status = unit.status.toLowerCase();
    switch (status) {
      case "booked":
        return "Booked";
      case "reserved":
        return "Reserved";
      case "available":
        return "Available";
      default:
        return "Available";
    }
  };

  const handleClick = (e) => {
    // Prevent click event if clicking on buttons
    if (e.target.tagName === "BUTTON") {
      return;
    }
    onUnitClick(unit);
  };

  return (
    <div className={`unit-card ${getStatusClass()}`} onClick={handleClick}>
      <div className="unit-header">
        <h3>Unit {unit.unitNumber}</h3>
        <span className={`status-badge ${getStatusClass()}`}>
          {getStatusText()}
        </span>
      </div>

      <div className="unit-actions">
        {isAdmin && (
          <button
            className="action-btn edit-btn"
            onClick={(e) => {
              e.stopPropagation();
              onUnitClick(unit);
            }}
          >
            Edit
          </button>
        )}
        {unit.status === "available" && !isAdmin && (
          <button
            className="action-btn book-btn"
            onClick={(e) => {
              e.stopPropagation();
              onBookingClick(unit);
            }}
          >
            Book
          </button>
        )}
      </div>
    </div>
  );
};

export default UnitCard;
