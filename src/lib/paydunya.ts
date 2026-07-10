// ============================================
// 26KADO - PayDunya Integration
// ============================================

export const PAYDUNYA_CONFIG = {
  apiKey: process.env.NEXT_PUBLIC_PAYDUNYA_API_KEY || "",
  secretKey: process.env.PAYDUNYA_SECRET_KEY || "",
  token: process.env.NEXT_PUBLIC_PAYDUNYA_TOKEN || "",
  masterKey: process.env.PAYDUNYA_MASTER_KEY || "",
  baseUrl: "https://app.paydunya.com/api/v1",
  sandbox: false, // Mode live
};

export const MIN_WITHDRAWAL_XOF = 5000; // Montant minimum de retrait en FCFA

// Mapping devise par pays (tous en FCFA)
export const CURRENCY_MAP: Record<string, { code: string; rate: number; symbol: string }> = {
  SN: { code: "XOF", rate: 1, symbol: "FCFA" },
  CI: { code: "XOF", rate: 1, symbol: "FCFA" },
  BF: { code: "XOF", rate: 1, symbol: "FCFA" },
  BJ: { code: "XOF", rate: 1, symbol: "FCFA" },
  TG: { code: "XOF", rate: 1, symbol: "FCFA" },
  ML: { code: "XOF", rate: 1, symbol: "FCFA" },
  CM: { code: "XAF", rate: 1, symbol: "FCFA" },
  GA: { code: "XAF", rate: 1, symbol: "FCFA" },
};

export function getCurrency(countryCode: string) {
  return CURRENCY_MAP[countryCode] || { code: "XOF", rate: 1, symbol: "FCFA" };
}

export function getMinWithdrawal(countryCode: string): number {
  return Math.round(MIN_WITHDRAWAL_XOF * (getCurrency(countryCode).rate));
}

export function formatLocalCurrency(amount: number, countryCode: string): string {
  const currency = getCurrency(countryCode);
  const localAmount = amount * currency.rate;
  return `${localAmount.toLocaleString()} ${currency.symbol}`;
}

// Headers pour l'API PayDunya
function getHeaders() {
  const timestamp = Math.floor(Date.now() / 1000);
  const signature = Buffer.from(
    `${PAYDUNYA_CONFIG.apiKey};${timestamp};${PAYDUNYA_CONFIG.masterKey}`
  ).toString("base64");

  return {
    "Content-Type": "application/json",
    "PAYDUNYA-MASTER-KEY": PAYDUNYA_CONFIG.masterKey,
    "PAYDUNYA-TOKEN": PAYDUNYA_CONFIG.token,
    "PAYDUNYA-PRIVATE-KEY": PAYDUNYA_CONFIG.secretKey,
    "PAYDUNYA-PUBLIC-KEY": PAYDUNYA_CONFIG.apiKey,
  };
}

// ============================================
// DÉPÔT : Créer une facture PayDunya
// ============================================
export async function createDepositInvoice(params: {
  amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  description: string;
  user_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
}) {
  const payload = {
    invoice: {
      items: [
        {
          name: params.description || "Dépôt 26KADO",
          quantity: 1,
          unit_price: params.amount,
          total_price: params.amount,
        },
      ],
      total_amount: params.amount,
      description: params.description || "Dépôt sur le compte 26KADO",
    },
    store: {
      name: "26KADO",
      website_url: process.env.NEXT_PUBLIC_SITE_URL,
    },
    actions: {
      cancel_url: params.cancel_url,
      return_url: params.return_url,
      notify_url: params.notify_url,
    },
    custom_data: {
      user_id: params.user_id,
      type: "deposit",
    },
    customer: {
      name: params.customer_name,
      email: params.customer_email,
      phone_number: params.customer_phone,
    },
  };

  try {
    const response = await fetch(`${PAYDUNYA_CONFIG.baseUrl}/checkout-invoice/create`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.response_text === "success" && data.invoice_url) {
      return {
        success: true,
        invoice_url: data.invoice_url,
        invoice_token: data.token,
        invoice_data: data,
      };
    }

    return { success: false, error: data.response_text || "Erreur PayDunya" };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur de connexion PayDunya" };
  }
}

// ============================================
// RETRAIT : Transfert d'argent via PayDunya
// ============================================
export async function createTransfer(params: {
  amount: number;
  operator: string; // orange_money, mtn_money, wave, moov, free_money, djamo
  phone: string;
  customer_name: string;
  user_id: string;
  description?: string;
}) {
  const payload = {
    account_number: params.phone.replace(/\s+/g, ""),
    operator: params.operator,
    amount: params.amount,
    description: params.description || "Retrait 26KADO",
    customer: {
      name: params.customer_name,
    },
    custom_data: {
      user_id: params.user_id,
      type: "withdrawal",
    },
  };

  try {
    const response = await fetch(`${PAYDUNYA_CONFIG.baseUrl}/transfert`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (data.response_text === "success" || data.status === "success") {
      return {
        success: true,
        transfer_id: data.transfer_id || data.token,
        transfer_data: data,
      };
    }

    return { success: false, error: data.response_text || "Erreur de transfert PayDunya" };
  } catch (err: any) {
    return { success: false, error: err.message || "Erreur de connexion PayDunya" };
  }
}

// ============================================
// VÉRIFIER LE STATUT D'UN PAIEMENT
// ============================================
export async function checkPaymentStatus(token: string) {
  try {
    const response = await fetch(`${PAYDUNYA_CONFIG.baseUrl}/checkout-invoice/confirm/${token}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (data.response_text === "success" && data.status === "completed") {
      return {
        success: true,
        status: data.status,
        amount: data.invoice?.total_amount,
        invoice_data: data,
      };
    }

    return {
      success: false,
      status: data.status || data.response_text,
      invoice_data: data,
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================
// VÉRIFIER LE STATUT D'UN TRANSFERT
// ============================================
export async function checkTransferStatus(transferId: string) {
  try {
    const response = await fetch(`${PAYDUNYA_CONFIG.baseUrl}/transfert/${transferId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    const data = await response.json();

    if (data.status === "success" || data.response_text === "success") {
      return {
        success: true,
        status: data.status || data.state,
        transfer_data: data,
      };
    }

    return { success: false, status: data.status, transfer_data: data };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}