import { MainApp } from "@/components/main-app";

// The page is a thin Server Component entry point.
// All layout, header, footer, and state live in MainApp (a Client Component)
// because they all need access to shared history and share-link state.
export default function Home() {
  return <MainApp />;
}
