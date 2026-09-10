import { useOrderEntry } from "../model/use-order-entry";
import { OrderEntryPageUI } from "./order-entry-page.ui";

export const OrderEntryPage = () => <OrderEntryPageUI {...useOrderEntry()} />;
