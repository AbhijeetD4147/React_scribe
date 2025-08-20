import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CalendarIcon, SearchIcon } from "lucide-react";

interface PatientEntry {
  id: string;
  name: string;
  date: string;
  hasNotification?: boolean;
  isComplete?: boolean;
}

const patientEntries: PatientEntry[] = [
  { id: "1", name: "Manish 813", date: "1/14/1960 (65) | 8/13/2025", hasNotification: false, isComplete: true },
  { id: "2", name: "Manish 813", date: "1/14/1960 (65) | 8/13/2025", hasNotification: true },
  { id: "3", name: "Manish 813", date: "1/14/1960 (65) | 8/13/2025", hasNotification: true },
  { id: "4", name: "TESTICOSIII TEST_", date: "1/1/1960 (65) | 8/18/2025", hasNotification: false, isComplete: true },
  { id: "5", name: "TESTICOSIII TEST_", date: "1/1/1960 (65) | 8/18/2025", hasNotification: true },
  { id: "6", name: "Marketing Demo", date: "1/1/1960 (65) | 8/14/2025", hasNotification: true },
  { id: "7", name: "New PatientTest's", date: "5/26/2007 (18) | 8/13/2025", hasNotification: true },
  { id: "8", name: "Test 1_demo", date: "1/1/1960 (65) | 8/13/2025", hasNotification: false, isComplete: true },
  { id: "9", name: "Test 1_demo", date: "1/1/1960 (65) | 8/13/2025", hasNotification: true },
  { id: "10", name: "Test Karson", date: "1/1/1960 (65) | 8/13/2025", hasNotification: false, isComplete: true },
  { id: "11", name: "Gangadhar Batla__", date: "1/6/2025 (0) | 8/13/2025", hasNotification: true },
  { id: "12", name: "Gangadhar Batla__", date: "1/6/2025 (0) | 8/13/2025", hasNotification: true },
  { id: "13", name: "Bayram Denktas__", date: "4/28/2022 (3) | 8/13/2025", hasNotification: true },
  { id: "14", name: "Akashit2 Jhonson__", date: "", hasNotification: false, isComplete: true },
];

interface PatientListSidebarProps {
  selectedPatientId?: string;
  onPatientSelect?: (patientId: string) => void;
}

export function PatientListSidebar({ selectedPatientId, onPatientSelect }: PatientListSidebarProps) {
  return (
    <div className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-sidebar-border">
        <div className="flex items-center gap-2 mb-3">
          <CalendarIcon className="w-4 h-4 text-medical-blue" />
          <span className="text-sm text-medical-text-primary">08/13/2025 - 08/19</span>
          <CalendarIcon className="w-4 h-4 text-medical-text-secondary ml-auto" />
        </div>
        <div className="relative">
          <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-medical-text-secondary" />
          <Input placeholder="Search..." className="pl-10 h-8 text-sm" />
        </div>
      </div>

      {/* Patient List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {patientEntries.map((patient) => (
            <div
              key={patient.id}
              className={`flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-sidebar-accent mb-1 ${
                selectedPatientId === patient.id ? "bg-sidebar-accent" : ""
              }`}
              onClick={() => onPatientSelect?.(patient.id)}
            >
              {/* Status indicator */}
              <div className="flex-shrink-0">
                {patient.isComplete ? (
                  <div className="w-2 h-2 rounded-full bg-medical-green"></div>
                ) : patient.hasNotification ? (
                  <div className="w-2 h-2 rounded-full bg-medical-orange"></div>
                ) : (
                  <div className="w-2 h-2"></div>
                )}
              </div>

              {/* Patient info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-medical-text-primary truncate">
                  {patient.name}
                </div>
                {patient.date && (
                  <div className="text-xs text-medical-text-secondary truncate">
                    {patient.date}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className="bg-medical-blue text-white p-2 rounded text-center text-sm font-medium">
          EVAA Secure & Compliant
        </div>
      </div>
    </div>
  );
}