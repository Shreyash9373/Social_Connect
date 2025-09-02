import { Suspense } from "react";
import PasswordResetConfirmForm from "./PasswordResetConfirmForm/page";

export default function PasswordResetConfirmWrapper() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PasswordResetConfirmForm />
    </Suspense>
  );
}
