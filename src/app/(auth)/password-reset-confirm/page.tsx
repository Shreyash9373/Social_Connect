import { Suspense } from "react";
import PasswordResetConfirmForm from "./PasswordResetConfirmComponent";

export default function PasswordResetConfirmWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordResetConfirmForm />
    </Suspense>
  );
}
