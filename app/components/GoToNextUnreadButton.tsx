import React from 'react';

interface GoToNextUnreadButtonProps {
  unreadMessagesCount: number;
  onScrollToNext: () => void;
}

const GoToNextUnreadButton: React.FC<GoToNextUnreadButtonProps> = ({ unreadMessagesCount, onScrollToNext }) => {
  if (unreadMessagesCount === 0) {
    return null;
  }

  return (
    <button
      onClick={onScrollToNext}
      className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-blue-500 text-white rounded-md shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      aria-label="Go to next unread message"
    >
      Go to next unread ({unreadMessagesCount})
    </button>
  );
};

export default GoToNextUnreadButton;
