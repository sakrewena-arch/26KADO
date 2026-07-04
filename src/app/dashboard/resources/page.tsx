"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getResources } from "@/lib/supabase/queries";
import { formatDate } from "@/lib/utils";
import { BookOpen, Download, Image, FileText, Video, ExternalLink } from "lucide-react";
import type { Resource } from "@/types";

const typeIcons: Record<string, React.ReactNode> = {
  banner: <Image className="w-5 h-5" />,
  image: <Image className="w-5 h-5" />,
  text: <FileText className="w-5 h-5" />,
  ad: <ExternalLink className="w-5 h-5" />,
  video: <Video className="w-5 h-5" />,
};

const typeColors: Record<string, string> = {
  banner: "from-blue-500/20 to-cyan-500/20 text-blue-400",
  image: "from-green-500/20 to-emerald-500/20 text-green-400",
  text: "from-yellow-500/20 to-amber-500/20 text-yellow-400",
  ad: "from-purple-500/20 to-pink-500/20 text-purple-400",
  video: "from-red-500/20 to-orange-500/20 text-red-400",
};

export default function ResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getResources().then((data) => {
      setResources(data);
      setLoading(false);
    });
  }, []);

  return (
    <DashboardLayout title="Ressources">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          [1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-32 rounded-2xl bg-white/5 animate-pulse" />
          ))
        ) : resources.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucune ressource disponible</p>
          </div>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id} variant="interactive" className="flex flex-col">
              <div className="flex items-center gap-3 mb-3">
                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeColors[resource.type] || typeColors.text}`}>
                  {typeIcons[resource.type] || <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-white">{resource.title}</h3>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {resource.type}
                  </Badge>
                </div>
              </div>
              {resource.content && (
                <p className="text-xs text-gray-400 flex-1 mb-3">{resource.content}</p>
              )}
              {resource.file_url && (
                <a
                  href={resource.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mt-auto"
                >
                  <Download className="w-3 h-3" />
                  Télécharger
                </a>
              )}
            </Card>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}