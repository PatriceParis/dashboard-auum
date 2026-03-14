import type { Creative } from "@/lib/types";
import { FileText, Globe, MoreHorizontal, Image, Video, Play } from "lucide-react";

interface Props {
  creative: Creative;
  campaignName?: string;
}

const MEDIA_BADGE: Record<Creative["mediaType"], { label: string; className: string }> = {
  document: { label: "Document", className: "bg-blue-100 text-blue-700" },
  image: { label: "Image", className: "bg-emerald-100 text-emerald-700" },
  video: { label: "Vidéo", className: "bg-purple-100 text-purple-700" },
  carousel: { label: "Carousel", className: "bg-amber-100 text-amber-700" },
  unknown: { label: "Autre", className: "bg-gray-100 text-gray-600" },
};

export function CreativeCard({ creative, campaignName }: Props) {
  const badge = MEDIA_BADGE[creative.mediaType];

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card flex flex-col">
      {/* Campaign name + media type badge */}
      <div className="px-3 py-2 flex items-center justify-between gap-2 bg-muted/30 border-b border-border">
        <span className="text-xs text-muted-foreground truncate">
          {campaignName || "—"}
        </span>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${badge.className}`}>
          {badge.label}
        </span>
      </div>

      {/* LinkedIn Post Header */}
      <div className="p-3 pb-2">
        <div className="flex items-start gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-bold text-primary">A</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm leading-tight">Auum</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1 leading-tight">
              Post sponsorisé · <Globe className="w-3 h-3" />
            </p>
          </div>
          <button className="text-muted-foreground hover:text-foreground p-1">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ad Text */}
      <div className="px-3 pb-3">
        <p className="text-sm whitespace-pre-line leading-relaxed">
          {creative.adText}
        </p>
      </div>

      {/* Media area */}
      <div className="bg-muted border-t border-b border-border">
        {creative.localMediaPath ? (
          <div className="relative">
            <img
              src={creative.localMediaPath}
              alt={creative.headline || creative.name}
              className="w-full"
            />
            {creative.mediaType === "video" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="w-6 h-6 text-white ml-1" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
            {creative.mediaType === "document" ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-14 h-14 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <FileText className="w-7 h-7 text-blue-500" />
                </div>
                <span className="text-xs font-medium">Document Ads</span>
              </div>
            ) : creative.mediaType === "video" ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Play className="w-7 h-7 text-purple-500 ml-0.5" />
                </div>
                <span className="text-xs font-medium">Vidéo</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <div className="w-14 h-14 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Image className="w-7 h-7 text-emerald-500" />
                </div>
                <span className="text-xs font-medium">Image</span>
              </div>
            )}
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
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {creative.landingPageUrl}
            </p>
          )}
        </div>
      )}

      {/* LinkedIn Action Bar */}
      <div className="px-3 py-2 flex items-center justify-around text-xs text-muted-foreground font-medium mt-auto">
        <span className="hover:text-foreground cursor-default">👍 J&apos;aime</span>
        <span className="hover:text-foreground cursor-default">💬 Commenter</span>
        <span className="hover:text-foreground cursor-default">🔄 Republier</span>
        <span className="hover:text-foreground cursor-default">📤 Envoyer</span>
      </div>
    </div>
  );
}
