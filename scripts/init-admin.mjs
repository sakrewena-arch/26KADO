// ============================================
// 26KADO - Script d'initialisation du compte admin
// Usage: node scripts/init-admin.mjs
// ============================================

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  try {
    const envPath = resolve(__dirname, "../.env.local");
    const content = readFileSync(envPath, "utf-8");
    const lines = content.split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const eqIndex = trimmed.indexOf("=");
        if (eqIndex > 0) {
          const key = trimmed.substring(0, eqIndex).trim();
          let value = trimmed.substring(eqIndex + 1).trim();
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          process.env[key] = value;
        }
      }
    }
    console.log("✅ Fichier .env.local chargé");
  } catch (err) {
    console.error("❌ Impossible de lire .env.local:", err.message);
    process.exit(1);
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Erreur: Variables d'environnement manquantes.");
  process.exit(1);
}

// Utiliser l'ANON_KEY (comme l'application) car la SERVICE_ROLE_KEY peut être invalide
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const ADMIN_EMAIL = "adminone26kado@26kado.com";
const ADMIN_PASSWORD = "Kado36912587";
const ADMIN_USERNAME = "adminone26kado";
const ADMIN_FULL_NAME = "Administrateur 26KADO";

async function initAdmin() {
  console.log("🚀 Initialisation du compte administrateur...\n");

  // 1. Essayer de se connecter (si le compte existe déjà)
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });

  if (signInData?.user) {
    console.log("✅ Le compte admin existe déjà et est accessible");
    
    // Mettre à jour le profil
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "super_admin", full_name: ADMIN_FULL_NAME, is_active: true })
      .eq("id", signInData.user.id);

    if (profileError) {
      console.error("❌ Erreur mise à jour profil:", profileError.message);
    } else {
      console.log("✅ Profil admin mis à jour (rôle: super_admin)");
    }
  } else {
    console.log("📝 Création du compte admin...");
    
    // 2. Créer le compte via signUp (comme le fait l'application)
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      options: {
        data: {
          full_name: ADMIN_FULL_NAME,
          username: ADMIN_USERNAME,
        },
      },
    });

    if (signUpError) {
      console.error("❌ Erreur création admin:", signUpError.message);
      process.exit(1);
    }

    if (!signUpData.user) {
      console.error("❌ Aucun utilisateur créé");
      process.exit(1);
    }

    console.log("✅ Compte admin créé (ID:", signUpData.user.id, ")");
    console.log("⏳ Attente de la création du profil par le trigger...");
    
    // Attendre que le trigger handle_new_user crée le profil
    await new Promise(r => setTimeout(r, 3000));

    // 3. Mettre à jour le rôle
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "super_admin", full_name: ADMIN_FULL_NAME, is_active: true })
      .eq("id", signUpData.user.id);

    if (profileError) {
      console.error("❌ Erreur mise à jour rôle:", profileError.message);
      console.log("   → Le profil a peut-être été créé. Connectez-vous et le rôle sera vérifié.");
    } else {
      console.log("✅ Rôle super_admin attribué");
    }
  }

  console.log("\n🔑 Identifiants de connexion :");
  console.log("   URL: http://localhost:3000/admin/login");
  console.log("   Utilisateur: adminone26kado");
  console.log("   Mot de passe: Kado36912587");
  console.log("\n✅ Initialisation terminée !");
}

initAdmin().catch(console.error);