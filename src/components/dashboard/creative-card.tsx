import type { Creative } from "@/lib/types";
import { FileText, Globe, MoreHorizontal } from "lucide-react";

interface Props {
  creative: Creative;
  campaignName?: string;
}

export function CreativeCard({ creative, campaignName }: Props) {
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card max-w-md">
      {/* LinkedIn Post Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2">
          {/* Company Avatar */}
          <img
            src="/cybervadis-logo.svg"
            alt="CyberVadis"
            className="w-12 h-12 rounded-full flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">CyberVadis</p>
            <p className="text-xs text-muted-foreground leading-tight">
              19 605 abonnés
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 leading-tight">
              Post sponsorisé · <Globe className="w-3 h-3" />
            </p>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-1">
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Ad Text */}
      <div className="px-3 pb-3">
        <p className="text-sm whitespace-pre-line leading-relaxed">
          {creative.adText}
        </p>
      </div>

      {/* Document Cover Image / Media */}
      <div className="bg-muted border-t border-b border-border">
        {creative.localMediaPath ? (
          <img
            src={creative.localMediaPath}
            alt={creative.headline || creative.name}
            className="w-full"
          />
        ) : (
          <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 relative">
            <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-8 h-8 text-primary" />
            </div>
          </div>
        )}
      </div>

      {/* Document Title / Link Preview */}
      {(creative.headline || creative.landingPageUrl) && (
        <div className="px-3 py-2.5 border-b border-border bg-muted/30">
          {creative.headline && (
            <p className="text-sm font-semibold leading-snug line-clamp-2">
              {creative.headline}
            </p>
          )}
          {creative.landingPageUrl && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {creative.landingPageUrl}
            </p>
          )}
        </div>
      )}

      {/* LinkedIn Action Bar */}
      <div className="px-3 py-2 flex items-center justify-around text-xs text-muted-foreground font-medium">
        <span className="flex items-center gap-1 hover:text-foreground cursor-default">
          👍 J&apos;aime
        </span>
        <span className="flex items-center gap-1 hover:text-foreground cursor-default">
          💬 Commenter
        </span>
        <span className="flex items-center gap-1 hover:text-foreground cursor-default">
          🔄 Republier
        </span>
        <span className="flex items-center gap-1 hover:text-foreground cursor-default">
          📤 Envoyer
        </span>
      </div>
    </div>
  );
}
