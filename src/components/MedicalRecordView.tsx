import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRightIcon, FileTextIcon, PrinterIcon } from "lucide-react";

export function MedicalRecordView() {
  return (
    <div className="flex-1 bg-white">
      {/* Header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-medical-text-primary">
              Manish 813 | 1/14/1960
            </h1>
            <Badge variant="secondary" className="bg-medical-green text-white text-xs">
              ✓ Finalized
            </Badge>
          </div>
          
          <Button variant="outline" size="sm" className="mx-4">
            <FileTextIcon className="w-4 h-4 mr-1" />
            Copy
          </Button>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <PrinterIcon className="w-4 h-4 mr-1" />
              Print
            </Button>
            <Button variant="outline" size="sm">
              <FileTextIcon className="w-4 h-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6 space-y-6">
          {/* Chief Complaint */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">Chief Complaint:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <p className="text-medical-text-primary leading-relaxed">
              Patient reports worsening vision, stating 'it seems like my near vision is 
              worse... when I looked at the screen row on long distance, I can hardly see far away.'
            </p>
          </div>

          {/* HPI */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">HPI:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <p className="text-medical-text-primary leading-relaxed">
              The patient, who wears glasses intermittently, presents with a complaint of 
              worsening vision at both near and distance. He feels his vision has declined. He 
              has a history of hypertension. He has tried progressive lenses in the past and found them 
              difficult to get used to.
            </p>
          </div>

          {/* Current Eye Symptoms */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">Current Eye Symptoms:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <div className="space-y-2">
              <p className="text-medical-text-primary">
                <span className="font-medium">Dryness:</span> Patient reports eyes feel dry 'not really very often'. SPEED score was 6.
              </p>
              <p className="text-medical-text-primary">
                <span className="font-medium">Blurred Vision Near:</span> Patient states his near vision seems worse.
              </p>
            </div>
          </div>

          {/* Problems */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">Problems:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <div className="space-y-1">
              <p className="text-medical-text-primary">1. Hypertension</p>
              <p className="text-medical-text-primary">2. Mild hypertensive retinopathy</p>
              <p className="text-medical-text-primary">3. White without pressure of retina, bilateral</p>
              <p className="text-medical-text-primary">4. Multiple pigmented papillomas on left upper and lower eyelids</p>
              <p className="text-medical-text-primary">5. Meibomian gland dysfunction, bilateral</p>
            </div>
          </div>

          {/* Allergies */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">Allergies:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <div className="bg-medical-gray-light p-3 rounded">
              <p className="text-medical-text-primary font-medium">Allergy:</p>
            </div>
          </div>

          {/* Eye Diseases */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">Eye Diseases:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <div className="space-y-1">
              <p className="text-medical-text-primary">1. Mild hypertensive retinopathy (questionable)</p>
              <p className="text-medical-text-primary">2. White without pressure, OU</p>
              <p className="text-medical-text-primary">3. Multiple pigmented papillomas, left eyelids</p>
              <p className="text-medical-text-primary">4. Conjunctival physiologic pigmentation, OU</p>
              <p className="text-medical-text-primary">5. Mild Arcus, OU</p>
              <p className="text-medical-text-primary">6. Meibomian Gland Dysfunction, OU</p>
            </div>
          </div>

          {/* Review of Systems */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-medical-text-primary">Review Of Systems - Brief:</h2>
              <ChevronRightIcon className="w-4 h-4 text-medical-blue" />
            </div>
            <p className="text-medical-text-primary">
              Patient denies taking any daily medications. He confirms a
            </p>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}