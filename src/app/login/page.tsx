import { Suspense } from "react";
import LoginClient from "./login-client";

// useSearchParams() must sit inside a Suspense boundary or Next 15 fails
// to prerender this route.
export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginClient />
    </Suspense>
  );
}
