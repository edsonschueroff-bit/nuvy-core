import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { createEmailPasswordUser } from "@/lib/firebase-auth-rest";

interface ProvisionPartnerAccessInput {
  loginEmail: string;
  loginPassword: string;
  contactName: string;
  partnerId: string;
}

export async function provisionPartnerAccess(input: ProvisionPartnerAccessInput) {
  const authUser = await createEmailPasswordUser(
    input.loginEmail,
    input.loginPassword
  );

  await setDoc(doc(db, "users", authUser.localId), {
    email: input.loginEmail,
    name: input.contactName,
    role: "parceiro",
    partnerId: input.partnerId,
    isActive: true,
    createdAt: serverTimestamp(),
  });

  return authUser.localId;
}
