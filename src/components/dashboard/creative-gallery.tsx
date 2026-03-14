"use client";

import { useState, useMemo } from "react";
import type { Creative, Campaign } from "@/lib/types";
import { CreativeCard } from "./creative-card";
import { FileText, Image, Video, Layers, Filter } from "lucide-react";

interface Props {
  creatives: Creative[];
  campaigns: Campaign[];
}

const MEDIA_FILTERS = [
  { key: "all", label: "Tous", icon: Layers },
  { key: "document", label: "Documents", icon: FileText },
  { key: "image", label: "Images", icon: Image },
  { key: "video", label: "Vidéos", icon: Video },
] as const;

type MediaFilter = typeof MEDIA_FILTERS[number]["key"];

export function CreativeGallery({ creatives, campaigns }: Props) {
  const [activeFilter, setActiveFilter] = useState<MediaFilter>("all");
  const campaignMap = new Map(campaigns.map((c) => [c.id, c]));

  const counts = useMemo(() => {
    const c = { all: creatives.length, document: 0, image: 0, video: 0 };
    for (const cr of creatives) {
      if (cr.mediaType === "document") c.document++;
      else if (cr.mediaType === "image") c.image++;
      else if (cr.mediaType === "video") c.video++;
    }
    return c;
  }, [creatives]);

  const filtered = useMemo(() => {
    if (activeFilter === "all") return creatives;
    return creatives.filter((cr) => cr.mediaType === activeFilter);
  }, [creatives, activeFilter]);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-muted-foreground" />
        {MEDIA_FILTERS.map(({ key, label, icon: Icon }) => {
          const count = counts[key as keyof typeof counts] || 0;
          if (key !== "all" && count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setActiveFilter(key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeFilter === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              <span className={`ml-0.5 ${activeFilter === key ? "opacity-80" : "opacity-60"}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((creative) => (
          <CreativeCard
            key={creative.id}
            creative={creative}
            campaignName={campaignMap.get(creative.campaignId)?.campaignGroupName || campaignMap.get(creative.campaignId)?.name}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucune creative pour ce filtre
        </div>
      )}
    </div>
  );
}
