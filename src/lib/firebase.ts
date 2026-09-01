// Este arquivo documenta a configuração esperada do Firebase para quando o
// projeto for conectado a um banco de dados real. Por enquanto, NADA aqui é
// inicializado — todos os dados do app vêm de src/lib/mock-data e
// src/lib/data (camada que simula chamadas assíncronas ao Firestore).
//
// Quando for conectar de verdade:
// 1. `npm install firebase`
// 2. Criar um projeto no console do Firebase e habilitar Auth (E-mail/Senha) e Firestore
// 3. Preencher as variáveis de ambiente abaixo em um arquivo `.env.local`
// 4. Trocar as funções de src/lib/data/*.ts para chamar o Firestore/Auth em
//    vez de ler/escrever em src/lib/data/store.ts — as assinaturas (async,
//    filtradas por companyId) já foram desenhadas para essa transição.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
