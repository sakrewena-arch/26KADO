const fs=require("fs");const path=require("path");const base="c:\\Users\\DG\\Desktop\\26kdo\\src\\app\\admin";function w(r,c2){const f=path.join(base,r);const d=path.dirname(f);if(!fs.existsSync(d))fs.mkdirSync(d,{recursive:true});fs.writeFileSync(f,c2,"utf8");console.log("OK:"+r);}
// DASHBOARD
const dashContent = [
  ""use client";",
  "import { useState, useEffect } from "react";",
  "import { Users, Upload, ArrowUpFromLine, Headphones, Coins, TrendingUp, Activity, DollarSign, FileText, CreditCard, CheckCircle, XCircle, Clock, UserPlus } from "lucide-react";",
  "import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";",
  "import AdminLayout from "@/components/layout/AdminLayout";",
  "import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";",
  "import { Badge } from "@/components/ui/badge";",
  "import { createClient } from "@/lib/supabase/client";",
  "import { formatCurrency, formatDateTime, getStatusLabel } from "@/lib/utils";",
  "import type { AdminLog, Commission, Profile } from "@/types";",
  "const supabase = createClient();",
].join("\n");
w("page.tsx", dashContent);
console.log("Dashboard done");