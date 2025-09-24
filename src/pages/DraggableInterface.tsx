import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DraggableToolbar } from "@/components/DraggableToolbar";
import VirtualAssistant from '@/components/VirtualAssistant';

const DraggableInterface = () => {
  const [popOutWindow, setPopOutWindow] = useState<Window | null>(null);

  const handlePopOut = () => {
    const newWindow = window.open('', '_blank', 'width=1200,height=800');
    if (newWindow) {
      newWindow.document.title = 'Virtual Assistant';
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          const newStyleEl = newWindow.document.createElement('style');
          newStyleEl.textContent = Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('\n');
          newWindow.document.head.appendChild(newStyleEl);
        } catch (e) {
          console.error('Could not copy stylesheet:', e);
        }
      });
      const appRoot = newWindow.document.createElement('div');
      newWindow.document.body.appendChild(appRoot);
      setPopOutWindow(newWindow);
    }
  };

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (popOutWindow) {
        popOutWindow.close();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (popOutWindow) {
        popOutWindow.close();
      }
    };
  }, [popOutWindow]);

  return (
    <div className="h-screen w-screen bg-gray-50">
      <DraggableToolbar />
      <div className="p-4">
        <button
          onClick={handlePopOut}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Open Virtual Assistant
        </button>
      </div>
      {popOutWindow && ReactDOM.createPortal(
        <VirtualAssistant
          updateWithApiResponse={(response) => {
            // Handle API response update
            console.log('API Response:', response);
          }}
        />,
        popOutWindow.document.body
      )}
    </div>
  );
};

export default DraggableInterface;