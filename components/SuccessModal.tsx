'use client';

import Modal from './Modal';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function SuccessModal({ isOpen, onClose, title = 'Success!', message }: SuccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <p className="text-center text-gray-700">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-colors"
          >
            OK
          </button>
        </div>
      </div>
    </Modal>
  );
}

