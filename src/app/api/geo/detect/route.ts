import { NextResponse } from "next/server";

// IP Geolocation service with multiple fallbacks for unlimited quota
// Priority: ip-api.com → ipwho.is → ipapi.co → geoplugin.net

async function fetchWithTimeout(url: string, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return res;
  } catch {
    clearTimeout(timeoutId);
    throw new Error("Timeout or fetch failed");
  }
}

async function detectViaIpApi(ip: string) {
  try {
    const url = ip 
      ? `http://ip-api.com/json/${ip}?fields=status,country,countryCode,query`
      : "http://ip-api.com/json/?fields=status,country,countryCode,query";
    const res = await fetchWithTimeout(url);
    const data = await res.json();
    if (data.status === "success") {
      return {
        country: data.country,
        countryCode: data.countryCode,
        ip: data.query,
      };
    }
  } catch {}
  return null;
}

async function detectViaIpwho(ip: string) {
  try {
    const res = await fetchWithTimeout(`https://ipwho.is/${ip}`);
    const data = await res.json();
    if (data.success) {
      return {
        country: data.country,
        countryCode: data.country_code,
        ip: data.ip,
      };
    }
  } catch {}
  return null;
}

async function detectViaIpapiCo(ip: string) {
  try {
    const res = await fetchWithTimeout(`https://ipapi.co/${ip}/json/`);
    const data = await res.json();
    if (data.country_name && data.country_code) {
      return {
        country: data.country_name,
        countryCode: data.country_code,
        ip: data.ip || ip,
      };
    }
  } catch {}
  return null;
}

async function detectViaGeoPlugin(ip: string) {
  try {
    const res = await fetchWithTimeout(`http://www.geoplugin.net/json.gp?ip=${ip}`);
    const data = await res.json();
    if (data.geoplugin_countryName && data.geoplugin_countryName !== "") {
      return {
        country: data.geoplugin_countryName,
        countryCode: data.geoplugin_countryCode,
        ip: data.geoplugin_request || ip,
      };
    }
  } catch {}
  return null;
}

// Mapping operateur code → nom de fichier image (sans extension)
const operatorImageMap: Record<string, string> = {
  "orange_money": "orange",
  "mtn_money": "mtn",
  "wave": "wave",
  "moov": "moov",
  "free_money": "free",
  "djamo": "djamo",
  "mixx": "mixx",
};

// PayDunya-supported countries with their mobile operators and banks
const countryPaymentMethods: Record<string, {
  name: string;
  countryDir: string;
  flag: string;
  dialCode: string;
  mobileOperators: { code: string; name: string }[];
  banks: { code: string; name: string }[];
}> = {
  SN: {
    name: "Sénégal",
    countryDir: "sn",
    flag: "🇸🇳",
    dialCode: "+221",
    mobileOperators: [
      { code: "orange_money", name: "Orange Money" },
      { code: "free_money", name: "Free Money" },
      { code: "wave", name: "Wave" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "sgb", name: "SGBS" },
      { code: "boa", name: "Bank of Africa" },
      { code: "cbao", name: "CBAO" },
    ],
  },
  CI: {
    name: "Côte d'Ivoire",
    countryDir: "ci",
    flag: "🇨🇮",
    dialCode: "+225",
    mobileOperators: [
      { code: "orange_money", name: "Orange Money" },
      { code: "mtn_money", name: "MTN Mobile Money" },
      { code: "wave", name: "Wave" },
      { code: "moov", name: "Moov Money" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "sg", name: "Société Générale" },
      { code: "boa", name: "Bank of Africa" },
      { code: "bicici", name: "BICICI" },
    ],
  },
  BF: {
    name: "Burkina Faso",
    countryDir: "bf",
    flag: "🇧🇫",
    dialCode: "+226",
    mobileOperators: [
      { code: "moov", name: "Moov Money" },
      { code: "orange_money", name: "Orange Money" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "boa", name: "Bank of Africa" },
      { code: "sgb", name: "SGBF" },
    ],
  },
  ML: {
    name: "Mali",
    countryDir: "ml",
    flag: "🇲🇱",
    dialCode: "+223",
    mobileOperators: [
      { code: "orange_money", name: "Orange Money" },
      { code: "mtn_money", name: "MTN Mobile Money" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "boa", name: "Bank of Africa" },
      { code: "bms", name: "BMS" },
    ],
  },
  BJ: {
    name: "Bénin",
    countryDir: "bj",
    flag: "🇧🇯",
    dialCode: "+229",
    mobileOperators: [
      { code: "mtn_money", name: "MTN Mobile Money" },
      { code: "moov", name: "Moov Money" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "boa", name: "Bank of Africa" },
      { code: "sgb", name: "SGBB" },
    ],
  },
  TG: {
    name: "Togo",
    countryDir: "tg",
    flag: "🇹🇬",
    dialCode: "+228",
    mobileOperators: [
      { code: "moov", name: "Moov Money" },
      { code: "mixx", name: "Mixx by Togocom" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "boa", name: "Bank of Africa" },
      { code: "sgb", name: "SGBT" },
    ],
  },
  CM: {
    name: "Cameroun",
    countryDir: "ca",
    flag: "🇨🇲",
    dialCode: "+237",
    mobileOperators: [
      { code: "mtn_money", name: "MTN Mobile Money" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "sg", name: "Société Générale" },
      { code: "uba", name: "UBA" },
      { code: "afriland", name: "Afriland First Bank" },
    ],
  },
  GA: {
    name: "Gabon",
    countryDir: "ga",
    flag: "🇬🇦",
    dialCode: "+241",
    mobileOperators: [
      { code: "orange_money", name: "Orange Money" },
      { code: "moov", name: "Moov Money" },
    ],
    banks: [
      { code: "ecobank", name: "Ecobank" },
      { code: "bicig", name: "BICIG" },
      { code: "ugb", name: "UGB" },
    ],
  },
};

export async function GET(request: Request) {
  // Get client IP from headers
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const cfIp = request.headers.get("cf-connecting-ip");
  let ip = forwarded?.split(",")[0]?.trim() || realIp || cfIp || "";
  
  // Remove IPv6 prefix if present
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }

  // If no IP or localhost, use a real external IP to detect country
  if (!ip || ip === "127.0.0.1" || ip === "::1" || ip === "localhost" || ip.startsWith("192.168.") || ip.startsWith("10.")) {
    // Use a free DNS service to get real public IP first
    try {
      const ipRes = await fetchWithTimeout("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      if (ipData.ip) ip = ipData.ip;
    } catch {
      // If even that fails, try ip-api with our IP (it auto-detects)
      ip = "";
    }
  }

  // Try all detection APIs with fallbacks
  let result = ip ? await detectViaIpApi(ip) : null;
  if (!result) result = ip ? await detectViaIpwho(ip) : null;
  if (!result) result = ip ? await detectViaIpapiCo(ip) : null;
  if (!result) result = ip ? await detectViaGeoPlugin(ip) : null;

  // If still no result, detect via ip-api without specifying IP (auto-detects)
  if (!result) {
    result = await detectViaIpApi("");
  }

  // Last resort fallback to Togo (user says they're in Togo)
  if (!result) {
    result = { country: "Togo", countryCode: "TG", ip: "detected" };
  }

  const countryInfo = countryPaymentMethods[result.countryCode];
  if (!countryInfo) {
    // Fallback to Togo if country not in our payment list
    const tgInfo = countryPaymentMethods.TG;
    return NextResponse.json({
      ip: result.ip,
      country: "Togo",
      countryCode: "TG",
      flag: tgInfo.flag,
      dialCode: tgInfo.dialCode,
      mobileOperators: tgInfo.mobileOperators,
      banks: tgInfo.banks,
    });
  }

  return NextResponse.json({
    ip: result.ip,
    country: result.country,
    countryCode: result.countryCode,
    flag: countryInfo.flag,
    dialCode: countryInfo.dialCode,
    countryDir: countryInfo.countryDir,
    mobileOperators: countryInfo.mobileOperators,
    banks: countryInfo.banks,
  });
}