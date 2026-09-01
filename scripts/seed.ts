/**
 * One-off local script to populate Firestore + Firebase Auth with the same
 * demo data used by the (now retired) localStorage mock. Uses the Admin SDK,
 * which bypasses firestore.rules entirely — never run this against a
 * production project with real customer data.
 *
 * Usage: npm run seed
 * Requires a service account key at ./serviceAccountKey.json (gitignored) —
 * Firebase console → Project settings → Service accounts → Generate new private key.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

import { companies } from "../src/lib/mock-data/companies";
import { categories } from "../src/lib/mock-data/categories";
import { contacts } from "../src/lib/mock-data/contacts";
import { transactions } from "../src/lib/mock-data/transactions";
import { users } from "../src/lib/mock-data/users";

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? path.resolve(process.cwd(), "serviceAccountKey.json");
const serviceAccount = JSON.parse(readFileSync(keyPath, "utf-8"));

const app = initializeApp({ credential: cert(serviceAccount) });
// The Firestore database was created in the console with the id "default",
// which is a *named* database, not the special "(default)" one the Admin
// SDK targets when no id is passed — so it must be passed explicitly here.
const db = getFirestore(app, "default");
const auth = getAuth(app);

async function seedCollection<T extends { id: string }>(collectionName: string, items: T[]) {
  console.log(`Seeding ${collectionName} (${items.length})...`);
  for (const item of items) {
    const { id, ...data } = item;
    await db.collection(collectionName).doc(id).set(data);
  }
}

async function seedUsers() {
  console.log(`Seeding users (${users.length})...`);
  for (const seedUser of users) {
    let uid: string;
    try {
      const existing = await auth.getUserByEmail(seedUser.email);
      uid = existing.uid;
      await auth.updateUser(uid, { password: seedUser.password, displayName: seedUser.name });
    } catch {
      const created = await auth.createUser({
        email: seedUser.email,
        password: seedUser.password,
        displayName: seedUser.name,
      });
      uid = created.uid;
    }
    await db.collection("users").doc(uid).set({
      companyId: seedUser.companyId,
      name: seedUser.name,
      email: seedUser.email,
      role: seedUser.role,
    });
    console.log(`  ${seedUser.email} -> ${uid}`);
  }
}

async function main() {
  await seedCollection("companies", companies);
  await seedCollection("categories", categories);
  await seedCollection("contacts", contacts);
  await seedCollection("transactions", transactions);
  await seedUsers();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
