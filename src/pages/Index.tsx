import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Monitor, Move } from "lucide-react";

const Index = () => {
  return (
    <div className="h-screen w-screen bg-gradient-to-br from-secondary to-gray-100 flex items-center justify-center">
      <div className="max-w-2xl mx-auto p-8 bg-white rounded-2xl shadow-xl border border-gray-200">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Medical Interface</h1>
          <p className="text-lg text-gray-600">Choose your preferred interface mode</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Full Screen Medical Interface */}
          <Link to="/medical" className="group">
            <div className="p-6 border-2 border-primary/20 rounded-xl hover:border-primary/40 transition-all duration-300 hover:shadow-lg bg-primary/10 hover:bg-primary/20">
              <div className="flex items-center justify-center mb-4">
                <Monitor className="w-12 h-12 text-primary" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Full Screen Mode</h2>
              <p className="text-gray-600 text-center mb-4">
                Direct access to the complete medical interface in full screen
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white">
                Open Full Screen
              </Button>
            </div>
          </Link>

          {/* Draggable Toolbar Interface */}
          <Link to="/draggable" className="group">
            <div className="p-6 border-2 border-green-200 rounded-xl hover:border-green-400 transition-all duration-300 hover:shadow-lg bg-green-50 hover:bg-green-100">
              <div className="flex items-center justify-center mb-4">
                <Move className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2 text-center">Draggable Mode</h2>
              <p className="text-gray-600 text-center mb-4">
                Compact draggable toolbar that can expand to show the medical interface
              </p>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                Open Draggable
              </Button>
            </div>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">Interface Features:</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• <strong>Full Screen:</strong> Traditional full-screen medical interface</li>
            <li>• <strong>Draggable:</strong> Compact toolbar with expand/collapse functionality</li>
            <li>• Both interfaces provide complete medical functionality</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Index;
