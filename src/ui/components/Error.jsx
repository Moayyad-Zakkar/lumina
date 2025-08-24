/*
export default function Error({ error }) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
      </div>
    </div>
  );
}
*/
import { useState } from 'react';

export default function Error({ error }) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">{error}</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="ml-4 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Close error message"
        >
          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
