import "./DeletePrompt.css";

const DeletePrompt = ({ onClose, onConfirm, patient }) => {
  if (!patient) return null; // Prevent rendering before patient is selected

  return (
    <div className="delete-overlay">
      <div className="delete-box">
        <h2>Delete Patient?</h2>
        <p>
          Are you sure you want to delete record for <b>{patient.name}</b> 
          (ID: <b>{patient.id}</b>)?
        </p>
        <p style={{ color: "red", marginTop: "5px" }}>
          This action is permanent and cannot be undone.
        </p>

        <div className="delete-actions">
          <button className="cancel-btn" onClick={onClose}>Cancel</button>
          <button className="delete-btn" onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default DeletePrompt;
