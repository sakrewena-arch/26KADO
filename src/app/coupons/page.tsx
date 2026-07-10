"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Ticket, Calendar, X, ZoomIn, AlertCircle, Filter } from "lucide-react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getCoupons } from "@/lib/supabase/queries";
import type { Coupon } from "@/types";

type FilterPeriod = "today" | "week" | "month" | "all";

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

function isThisWeek(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(today.getDate() - 7);
  return date >= weekAgo;
}

function isThisMonth(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

const filters: { key: FilterPeriod; label: string }[] = [
  { key: "today", label: "Aujourd'hui" },
  { key: "week", label: "Cette semaine" },
  { key: "month", label: "Ce mois" },
  { key: "all", label: "Tout" },
];

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [period, setPeriod] = useState<FilterPeriod>("today");

  useEffect(() => {
    async function load() {
      try {
        const data = await getCoupons();
        setCoupons(data);
      } catch (err) {
        console.error("Failed to load coupons", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredCoupons = useMemo(() => {
    switch (period) {
      case "today": return coupons.filter((c) => isToday(c.created_at));
      case "week": return coupons.filter((c) => isThisWeek(c.created_at));
      case "month": return coupons.filter((c) => isThisMonth(c.created_at));
      case "all": return coupons;
      default: return coupons;
    }
  }, [coupons, period]);

  return (
    <main className="min-h-screen">
      <Header />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightboxImage(null)}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 cursor-pointer"
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              src={lightboxImage}
              alt="Image en grand"
              className="max-w-full max-h-full object-contain rounded-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <section className="relative pt-32 pb-16 lg:pb-24 overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-green-500/10 rounded-full blur-3xl animate-pulse-slow" />
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-8"
          >
            <Badge variant="premium" className="mb-4 px-4 py-1.5 text-sm">
              <Ticket className="w-4 h-4 mr-1" />
              Coupons Exclusifs
            </Badge>
            <h1 className="text-4xl lg:text-6xl font-bold text-white mb-4">
              Nos <span className="text-gradient">Coupons</span>
            </h1>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Accédez à nos coupons exclusifs pour maximiser vos gains sur les bookmakers partenaires.
            </p>
          </motion.div>

          {/* Filtres */}
          <div className="flex flex-wrap items-center justify-center gap-2 mb-10">
            <Filter className="w-4 h-4 text-gray-500" />
            {filters.map((f) => (
              <Button
                key={f.key}
                variant={period === f.key ? "premium" : "outline"}
                size="sm"
                onClick={() => setPeriod(f.key)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-64 rounded-2xl bg-white/5 animate-pulse" />
              ))}
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400">
                {period === "today" ? "Aucun coupon aujourd'hui" : "Aucun coupon trouvé"}
              </h3>
              <p className="text-gray-500 mt-2">
                {period === "today"
                  ? "Revenez demain pour découvrir nos nouvelles offres."
                  : "Aucun coupon pour cette période."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCoupons.map((coupon, i) => (
                <motion.div
                  key={coupon.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card variant="premium" className="h-full overflow-hidden flex flex-col">
                    {coupon.image_url && (
                      <div
                        onClick={() => setLightboxImage(coupon.image_url!)}
                        className="relative h-56 -mx-6 -mt-6 mb-4 overflow-hidden group cursor-pointer"
                      >
                        <img
                          src={coupon.image_url}
                          alt={coupon.title}
                          className="w-full h-full object-contain bg-white/5 p-2"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-green-400 flex-shrink-0" />
                      {isToday(coupon.created_at) ? (
                        <Badge variant="success" className="text-[10px]">Aujourd'hui</Badge>
                      ) : (
                        <span className="text-xs text-gray-500">
                          {new Date(coupon.created_at).toLocaleDateString("fr-FR", { year: "numeric", month: "long", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">{coupon.title}</h3>
                    <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap break-words">{coupon.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  );
}