"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { formatDate } from "@/lib/utils";
import { Bell, CheckCheck, Mail, MailOpen } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  return (
    <DashboardLayout title="Notifications">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-400">
          {unreadCount} notification{unreadCount > 1 ? "s" : ""} non lue{unreadCount > 1 ? "s" : ""}
        </p>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllAsRead}>
            <CheckCheck className="w-4 h-4 mr-2" />
            Tout marquer comme lu
          </Button>
        )}
      </div>

      <Card>
        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500">Aucune notification</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-colors ${
                  notif.is_read ? "bg-transparent" : "bg-blue-500/5"
                } hover:bg-white/5`}
                onClick={() => !notif.is_read && markAsRead(notif.id)}
              >
                <div className={`p-2 rounded-lg ${
                  notif.is_read ? "bg-white/5 text-gray-500" : "bg-blue-500/20 text-blue-400"
                }`}>
                  {notif.is_read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${notif.is_read ? "text-gray-400" : "text-white font-medium"}`}>
                    {notif.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-600 mt-1">{formatDate(notif.created_at)}</p>
                </div>
                {!notif.is_read && (
                  <div className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0 mt-2" />
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </DashboardLayout>
  );
}