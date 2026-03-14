import type { Creative, Campaign } from "@/lib/types";
import { CreativeCard } from "./creative-card";

interface Props {
  creatives: Creative[];
  campaigns: Campaign[];
}

export function CreativeGallery({ creatives, campaigns }: Props) {
  const campaignMap = new Map(campaigns.map((c) => [c.id, c.name]));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {creatives.map((creative) => (
        <CreativeCard
          key={creative.id}
          creative={creative}
          campaignName={campaignMap.get(creative.campaignId)}
        />
      ))}
    </div>
  );
}
