import { Suspense } from "react";
import VerifyEmailPage from "./VerifyEmailComponent";

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailPage />
    </Suspense>
  );
}
