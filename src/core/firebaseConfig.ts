// Em: src/core/firebaseConfig.ts

// 1. Importamos as ferramentas que REALMENTE vamos usar:
// - initializeApp: Para iniciar a conexão
// - getAuth: Para cuidar da autenticação (login, cadastro)
// - getFirestore: Para cuidar do banco de dados (salvar transações, etc.)
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 2. Aqui estão as suas credenciais que você acabou de pegar. Perfeito!
const firebaseConfig = {
  apiKey: import.meta.env.VITE_API_KEY,
  authDomain: import.meta.env.VITE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_ID,
  measurementId: import.meta.env.VITE_MEASUREMENT_ID
};

// 3. Inicializamos o Firebase e exportamos apenas o que vamos precisar no resto do app
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Nosso gerenciador de autenticação
export const db = getFirestore(app); // Nosso gerenciador de banco de dados