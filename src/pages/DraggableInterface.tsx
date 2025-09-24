import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { DraggableToolbar } from "@/components/DraggableToolbar";
import VirtualAssistant from '@/components/VirtualAssistant';

const DraggableInterface = () => {
  const [popOutWindow, setPopOutWindow] = useState<Window | null>(null);

  const handlePopOut = () => {
    // Increase window size for better visibility
    const newWindow = window.open('', '_blank', 'width=1400,height=900');
    if (newWindow) {
      newWindow.document.title = 'Virtual Assistant';
      
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
        #virtual-assistant-container {
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
        .virtual-assistant-wrapper {
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
      appRoot.id = 'virtual-assistant-container';
      
      // Create a wrapper for scaling
      const wrapper = newWindow.document.createElement('div');
      wrapper.className = 'virtual-assistant-wrapper';
      
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
        popOutWindow.document.querySelector('.virtual-assistant-wrapper') || 
        popOutWindow.document.body
      )}
    </div>
  );
};

export default DraggableInterface;