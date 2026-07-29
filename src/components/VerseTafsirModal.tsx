import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { fetchTafsir } from "@/lib/quran-api";

interface VerseTafsirModalProps {
  isOpen: boolean;
  onClose: () => void;
  verseKey: string;
  tafsirId: string;
  verseTextUthmani: string;
}

export function VerseTafsirModal({ isOpen, onClose, verseKey, tafsirId, verseTextUthmani }: VerseTafsirModalProps) {
  const [tafsirData, setTafsirData] = useState<{ text: string, resource_name?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && verseKey) {
      setLoading(true);
      fetchTafsir(verseKey, parseInt(tafsirId)).then((data) => {
        setTafsirData(data);
        setLoading(false);
      });
    } else {
      setTafsirData(null);
    }
  }, [isOpen, verseKey, tafsirId]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-full sm:max-w-2xl h-[85vh] sm:h-auto sm:max-h-[85vh] flex flex-col bg-background/95 backdrop-blur-xl border border-white/10 z-[100] p-6 rounded-2xl shadow-2xl overflow-hidden">
        <DialogHeader className="mb-4 shrink-0 text-left">
          <DialogTitle className="text-xl flex items-center gap-2 text-foreground">
            Tafsir for {verseKey}
          </DialogTitle>
          <DialogDescription className="text-primary font-medium">
            {tafsirData?.resource_name || "Loading scholar insights..."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable Content Container */}
        <div data-lenis-prevent="true" className="flex-1 overflow-y-auto pr-2 space-y-6 min-h-0 scrollbar-thin">
          <div className="bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p className="font-arabic text-2xl text-right leading-loose text-foreground" dir="rtl">
              {verseTextUthmani}
            </p>
          </div>

          <div className="prose prose-sm md:prose-base prose-invert max-w-none text-muted-foreground leading-relaxed pb-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p>Loading Tafsir...</p>
              </div>
            ) : tafsirData ? (
              <div 
                dangerouslySetInnerHTML={{ __html: tafsirData.text }} 
                className="tafsir-content"
                dir={tafsirId === "16" || tafsirId === "91" || tafsirId === "14" || tafsirId === "164" ? "rtl" : "ltr"}
              />
            ) : (
              <p>Could not load Tafsir for this verse.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
