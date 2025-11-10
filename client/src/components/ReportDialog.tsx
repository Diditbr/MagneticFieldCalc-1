import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { FileText, Loader2 } from "lucide-react";
import type { ReportSection } from "@shared/schema";

interface ReportDialogProps {
  onGenerateReport: (sections: ReportSection[]) => Promise<void>;
  availableSections: {
    section: ReportSection;
    label: string;
    description: string;
    enabled: boolean;
  }[];
  isGenerating?: boolean;
}

export function ReportDialog({
  onGenerateReport,
  availableSections,
  isGenerating = false,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState<ReportSection[]>([]);

  // Reset and pre-select enabled sections when dialog opens (excluding field_visualization and documentation)
  useEffect(() => {
    if (open) {
      const enabledSections = availableSections
        .filter(s => s.enabled && s.section !== 'field_visualization' && s.section !== 'documentation')
        .map(s => s.section);
      setSelectedSections(enabledSections);
    }
  }, [open, availableSections]);

  const handleCheckboxChange = (section: ReportSection, checked: boolean) => {
    if (checked) {
      setSelectedSections([...selectedSections, section]);
    } else {
      setSelectedSections(selectedSections.filter((s) => s !== section));
    }
  };

  const handleGenerate = async () => {
    await onGenerateReport(selectedSections);
    setOpen(false);
    setSelectedSections([]);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="button-open-report-dialog">
          <FileText className="w-4 h-4 mr-2" />
          Report erstellen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Bericht erstellen</DialogTitle>
          <DialogDescription>
            Wählen Sie die Inhalte aus, die im PDF-Bericht enthalten sein sollen.
            Eingabedaten werden automatisch einbezogen.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {availableSections.map(({ section, label, description, enabled }) => (
            <div
              key={section}
              className="flex items-start space-x-3"
              data-testid={`section-option-${section}`}
            >
              <Checkbox
                id={section}
                checked={selectedSections.includes(section)}
                onCheckedChange={(checked) =>
                  handleCheckboxChange(section, checked === true)
                }
                disabled={!enabled || isGenerating}
                data-testid={`checkbox-${section}`}
              />
              <div className="flex-1">
                <Label
                  htmlFor={section}
                  className={`font-medium cursor-pointer ${
                    !enabled ? "text-muted-foreground" : ""
                  }`}
                >
                  {label}
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {description}
                  {!enabled && (
                    <span className="text-destructive ml-1">
                      (Keine Daten verfügbar)
                    </span>
                  )}
                </p>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button
            onClick={() => setOpen(false)}
            variant="outline"
            disabled={isGenerating}
            data-testid="button-cancel-report"
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={selectedSections.length === 0 || isGenerating}
            data-testid="button-generate-report"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Erstelle PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                PDF erstellen
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
