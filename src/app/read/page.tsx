import { Suspense } from "react";
import ReadQuran from "./[surahId]/page";
import Loading from "./loading";

export default function ReadPage() {
  return <Suspense fallback={<Loading />}><ReadQuran /></Suspense>;
}
