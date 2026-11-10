import { AppProviders } from "@/redux/AppProviders";
import { HomeView } from "@/features/home/HomeView";
import { LiveHome } from "@/features/home/LiveHome";

export default function HomePage() {
  // The static shell renders without session or stats; the live version streams in per request.
  return (
    <AppProviders fallback={<HomeView actions={<span className="size-9 rounded-full bg-canvas" aria-hidden />} />}>
      <LiveHome />
    </AppProviders>
  );
}
