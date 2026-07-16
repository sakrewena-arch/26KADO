"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Clock } from "lucide-react";

const DAYS_FR = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];

function getNextTuesday(): { daysLeft: number; hoursLeft: number; minutesLeft: number; isTuesday: boolean; dayName: string } {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Dim, 1=Lun, 2=Mar...
  const currentHour = now.getHours();
  const currentMin = now.getMinutes();

  // Mardi = 2
  if (currentDay === 2) {
    // C'est mardi, vérifier si on est avant la fin de la journée (23h59)
    return {
      daysLeft: 0,
      hoursLeft: 23 - currentHour,
      minutesLeft: 59 - currentMin,
      isTuesday: true,
      dayName: "Mardi",
    };
  }

  // Calculer le nombre de jours jusqu'au prochain mardi
  let daysUntilTuesday = (2 - currentDay + 7) % 7;
  if (daysUntilTuesday === 0) daysUntilTuesday = 7; // Si on est mardi mais après minuit

  const nextTuesday = new Date(now);
  nextTuesday.setDate(now.getDate() + daysUntilTuesday);
  nextTuesday.setHours(0, 0, 0, 0);

  const diffMs = nextTuesday.getTime() - now.getTime();
  const totalHours = Math.floor(diffMs / (1000 * 60 * 60));
  const daysLeft = Math.floor(totalHours / 24);
  const hoursLeft = totalHours % 24;
  const minutesLeft = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  return {
    daysLeft,
    hoursLeft,
    minutesLeft,
    isTuesday: false,
    dayName: DAYS_FR[2],
  };
}

export default function WithdrawalNotice() {
  const [timeLeft, setTimeLeft] = useState(getNextTuesday());

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getNextTuesday());
    }, 60000); // Mise à jour chaque minute
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-amber-500/20 shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-amber-400 mb-1">
            {timeLeft.isTuesday
              ? "Aujourd'hui c'est mardi ! 🎉"
              : "Retraits disponibles uniquement le mardi"}
          </p>
          <p className="text-xs text-amber-400/70 mb-2">
            Les retraits sont traités chaque mardi. Votre demande sera prise en compte le prochain jour de retrait.
          </p>
          {timeLeft.isTuesday ? (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Il vous reste {timeLeft.hoursLeft}h {timeLeft.minutesLeft}min pour effectuer votre retrait aujourd'hui
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-amber-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Prochain retrait dans {timeLeft.daysLeft > 0 ? `${timeLeft.daysLeft}j ` : ""}
                {timeLeft.hoursLeft}h {timeLeft.minutesLeft}min ({timeLeft.dayName})
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}