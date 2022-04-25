import { useState } from "react";
import { useKonami } from "react-konami-code";

export default function DominosModal() {
  const [isOpen, setIsOpen] = useState(false);

  useKonami(() => setIsOpen(true));

  const closeModal = () => setIsOpen(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="modal modal-open">
        <div className="modal-box">
          <p className="py-4">
            <a
              href="https://www.dominos.com/en/pages/order/#/locations/search/?type=Delivery"
              target="_blank"
              rel="noreferrer"
            >
              Order Delivery from Dominos Here!
            </a>
          </p>
          <div className="modal-action">
            <label htmlFor="my-modal" className="btn" onClick={closeModal}>
              Close Window
            </label>
          </div>
        </div>
      </div>
    </>
  );
}
