import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DraggableToolbar } from "@/components/DraggableToolbar";
import { MedicalInterface } from "@/components/MedicalInterface";

const DraggableInterface = () => {
  const [popOutWindow, setPopOutWindow] = useState<Window | null>(null);

  const handlePopOut = () => {
    // Increase window size for better visibility
    const newWindow = window.open('', '_blank', 'width=1400,height=900');
    if (newWindow) {
      newWindow.document.title = 'Medical Interface';
      
      // Add base styling to ensure proper scaling
      const styleEl = newWindow.document.createElement('style');
      styleEl.textContent = `
        html, body { 
          height: 100%; 
          margin: 0; 
          padding: 0; 
          overflow: hidden;
          background-color: #f9fafb;
        }
        #medical-interface-container {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          overflow: auto;
        }
        /* Override any fixed dimensions */
        .min-h-screen {
          min-height: unset !important;
        }
        /* Scale the component to fit the window */
        .medical-interface-wrapper {
          transform: scale(0.9);
          transform-origin: center center;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
      `;
      newWindow.document.head.appendChild(styleEl);
      
      // Copy existing stylesheets
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
      
      // Create a container with proper structure
      const appRoot = newWindow.document.createElement('div');
      appRoot.id = 'medical-interface-container';
      
      // Create a wrapper for scaling
      const wrapper = newWindow.document.createElement('div');
      wrapper.className = 'medical-interface-wrapper';
      
      appRoot.appendChild(wrapper);
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
          Open Medical Interface
        </button>
      </div>
      {popOutWindow && ReactDOM.createPortal(
        <MedicalInterface
          liveTranscription=""
        />,
        popOutWindow.document.querySelector('.medical-interface-wrapper') || 
        popOutWindow.document.body
      )}
    </div>
  );
};

export default DraggableInterface;