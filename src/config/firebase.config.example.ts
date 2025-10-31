// Template de configuração do Firebase
// Copie este arquivo para firebase.config.ts e preencha com suas credenciais reais
// O arquivo firebase.config.ts não será versionado no git por questões de segurança
import { FirebaseOptions } from 'firebase/app';

export const firebaseConfig: FirebaseOptions = {
  apiKey: "sua_api_key_aqui",
  authDomain: "seu_projeto.firebaseapp.com",
  projectId: "seu_projeto_id",
  storageBucket: "seu_projeto.appspot.com",
  messagingSenderId: "seu_sender_id",
  appId: "seu_app_id",
  measurementId: "seu_measurement_id"
};

