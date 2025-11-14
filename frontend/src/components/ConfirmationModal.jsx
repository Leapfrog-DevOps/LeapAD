import Loader from "./loader";

const defaultDescription =
  "This action might be permanent. Press Cancel to exit or Confirm to go ahead.";
const defaultTitle = "Are you sure you want to perform this action?";
const noop = () => {};

export default function ConfirmationModal({
  title = defaultTitle,
  description = defaultDescription,
  onConfirm = noop,
  onCancel = noop,
  loading = false,
}) {
  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <h3>{title}</h3>
        <br />
        {loading && (
          <div className="centered-always">
            <Loader />
          </div>
        )}
        <br />
        <p className="margin grey">{description}</p>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <button className="btnsmall margin" onClick={() => onConfirm()}>
            Confirm
          </button>
          <button className="btnsmall red margin" onClick={() => onCancel()}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
