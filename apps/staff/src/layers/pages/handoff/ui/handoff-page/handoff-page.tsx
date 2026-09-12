import { useHandoff } from "../../model/use-handoff";
import { HandoffPageUI } from "./handoff-page.ui";

export const HandoffPage = () => <HandoffPageUI {...useHandoff()} />;
