import { useKitchen } from "../../model/use-kitchen";
import { KitchenPageUI } from "./kitchen-page.ui";

export const KitchenPage = () => <KitchenPageUI {...useKitchen()} />;
