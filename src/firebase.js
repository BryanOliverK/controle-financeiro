import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore"

// Cole aqui a configuração que o Firebase mostra ao registrar o app web
// (Configurações do projeto > Seus apps > Configuração do SDK).
// Esses dados não são secretos: quem protege seus dados são as regras do Firestore.
const firebaseConfig = {
  apiKey: "AIzaSyBrwfjVx6ipEdKIto4V4HRUauX44MSSoRE",
  authDomain: "controle-financeiro-3e8fc.firebaseapp.com",
  projectId: "controle-financeiro-3e8fc",
  storageBucket: "controle-financeiro-3e8fc.firebasestorage.app",
  messagingSenderId: "780748001500",
  appId: "1:780748001500:web:7dbaca6725ef854d4ba419",
  measurementId: "G-WTXKMTQCWG"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)

export const provider = new GoogleAuthProvider()
provider.setCustomParameters({ prompt: "select_account" })

// Guarda uma cópia local, então o app continua abrindo sem internet
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
})
