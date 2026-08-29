import { Landing } from "./pages/Landing";
import { MissionControl } from "./pages/MissionControl";
import { useRoute } from "./router";

export default function App() {
  const route = useRoute();
  if (route === "/" || route === "") return <Landing />;
  return <MissionControl />;
}
