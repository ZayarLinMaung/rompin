import React from "react";
import "./UnitCard.css";

const UnitCard = ({ unit, onUnitClick, onBookingClick, isAdmin = false }) => {
  const getStatusClass = () => {
    const status = unit.status;
    switch (status) {
      case "ADVISE":
        return "advise";
      case "PRESENT":
        return "present";
      case "LA SIGNED":
        return "la-signed";
      case "SPA SIGNED":
        return "spa-signed";
      case "LOAN APPROVED":
        return "loan-approved";
      case "PENDING BUYER DOC":
        return "pending-buyer";
      case "LANDOWNER UNIT":
        return "landowner";
      case "LOAN IN PROCESS":
        return "loan-process";
      case "NEW BOOK":
        return "new-book";
      default:
        return "advise";
    }
  };

  const getStatusText = () => {
    const status = unit.status;
    switch (status) {
      case "ADVISE":
        return "Advise";
      case "PRESENT":
        return "Present";
      case "LA SIGNED":
        return "LA Signed";
      case "SPA SIGNED":
        return "SPA Signed";
      case "LOAN APPROVED":
        return "Loan Approved";
      case "PENDING BUYER DOC":
        return "Pending Buyer Doc";
      case "LANDOWNER UNIT":
        return "Landowner Unit";
      case "LOAN IN PROCESS":
        return "Loan in Process";
      case "NEW BOOK":
        return "New Book";
      default:
        return "Advise";
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
        {unit.status === "PRESENT" && !isAdmin && (
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
