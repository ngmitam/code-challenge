import "./Modal.css";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	message: string;
}

export function Modal({ isOpen, onClose, title, message }: ModalProps) {
	if (!isOpen) return null;

	return (
		<div className="modal-overlay" onClick={onClose}>
			<div className="modal-content" onClick={(e) => e.stopPropagation()}>
				<div className="modal-header">
					<h2>{title}</h2>
					<button className="modal-close" onClick={onClose}>
						×
					</button>
				</div>
				<div className="modal-body">
					<p>{message}</p>
				</div>
				<div className="modal-footer">
					<button className="modal-btn" onClick={onClose}>
						OK
					</button>
				</div>
			</div>
		</div>
	);
}
