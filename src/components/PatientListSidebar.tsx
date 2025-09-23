import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { CalendarIcon, PanelLeftClose, PanelRightClose, Menu, CheckCircle, AlertCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, subDays, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { getPatientList } from "../services/getPatientList_ExecStoredProcedure";

interface Patient {
  RECORDING_ID: number;
  PATIENT_NAME: string;
  DOB: string;
  AGE: number;
  RECORDING_DATE: string;
  IS_FINALIZED: boolean;
}

interface PatientListSidebarProps {
  selectedPatient?: Patient;
  onPatientSelect?: (patient: Patient) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  refreshList?: boolean;
}

export function PatientListSidebar({ selectedPatient, onPatientSelect, isCollapsed, onToggleCollapse, refreshList }: PatientListSidebarProps) {
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 6),
    to: new Date(),
  });
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<string>("Last Week");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  useEffect(() => {
    const fetchPatients = async () => {
      if (date?.from && date?.to) {
        if (isInitialLoad) {
          setIsLoading(true);
        }
        const startDate = format(date.from, "yyyy-MM-dd'T'HH:mm:ss");
        const endDate = format(date.to, "yyyy-MM-dd'T'HH:mm:ss");
        const data = await getPatientList(startDate, endDate);
        if (data) {
          const patientData = data.Table;
          setPatients(patientData);
          if (!selectedPatient && patientData.length > 0) {
            onPatientSelect?.(patientData[0]);
          }
        }
        setIsLoading(false);
        setIsInitialLoad(false);
      }
    };

    fetchPatients();
  }, [date, refreshList, selectedPatient, onPatientSelect]);

  const handlePresetClick = (preset: string, range: DateRange) => {
    setDate(range);
    setActivePreset(preset);
    setIsOpen(false);
  };

  return (
    <div className={`${isCollapsed ? "w-12" : "w-64"} bg-gray-50 flex flex-col h-full transition-all duration-300 rounded-lg border-r border-plum-600`} style={{ height: 'calc(100vh - 88px)' }}>
      {isCollapsed ? (
        <div className="flex flex-col items-center py-4">
          <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="text-plum-500">
            <PanelRightClose className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="h-[88px] p-4 flex flex-col justify-center">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-800">Patients</h2>
              <Button variant="ghost" size="icon" onClick={onToggleCollapse} className="text-plum-500">
                <PanelLeftClose className="w-5 h-5" />
              </Button>
            </div>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal h-9"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from && date.to ? (
                    `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="flex">
                  <div className="p-2 border-r">
                    <div className="text-sm font-semibold p-2">Presets</div>
                    <div className="flex flex-col">
                      <Button variant={activePreset === "Today" ? "default" : "ghost"} onClick={() => handlePresetClick("Today", { from: new Date(), to: new Date() })}>Today</Button>
                      <Button variant={activePreset === "Yesterday" ? "default" : "ghost"} onClick={() => handlePresetClick("Yesterday", { from: subDays(new Date(), 1), to: subDays(new Date(), 1) })}>Yesterday</Button>
                      <Button variant={activePreset === "Last Week" ? "default" : "ghost"} onClick={() => handlePresetClick("Last Week", { from: subDays(new Date(), 6), to: new Date() })}>Last Week</Button>
                      <Button variant={activePreset === "Last Month" ? "default" : "ghost"} onClick={() => handlePresetClick("Last Month", { from: subMonths(new Date(), 1), to: new Date() })}>Last Month</Button>
                    </div>
                  </div>
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Patient List */}
          <ScrollArea className="flex-1 h-0">
            <div className="p-2">
              {isLoading ? (
                <div className="p-4 text-center">Loading...</div>
              ) : (
                patients.map((patient) => (
                  <div
                    key={patient.RECORDING_ID}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer ${selectedPatient?.RECORDING_ID === patient.RECORDING_ID ? 'bg-white shadow-md' : 'hover:bg-white/60'}`}
                    style={{ borderLeft: selectedPatient?.RECORDING_ID === patient.RECORDING_ID ? '4px solid #9D4EDD' : '4px solid transparent' }}
                    onClick={() => onPatientSelect?.(patient)}
                  >
                    <div>
                      <div className="font-semibold text-sm text-gray-800">{patient.PATIENT_NAME}</div>
                      <div className="text-xs text-gray-500">{new Date(patient.DOB).toLocaleDateString()}</div>
                    </div>
                    {patient.IS_FINALIZED ? <CheckCircle className="w-5 h-5 text-green-500" /> : <AlertCircle className="w-5 h-5 text-orange-400" />}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="p-3">
            <div className="bg-plum-500 text-white p-2 rounded text-center text-sm font-medium">
              EVAA Secure & Compliant
            </div>
          </div>
        </>
      )}
    </div>
  );
}