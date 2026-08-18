import { trackEvent } from "~/utils/analytics";

export const useBuyCreditsModal = () => {
  const isOpen = useState("buyCreditsModalOpen", () => false);
  const purchasedTick = useState("buyCreditsPurchasedTick", () => 0);

  const openBuyCreditsModal = () => {
    isOpen.value = true;
    trackEvent("top_up_begin");
  };

  const closeBuyCreditsModal = () => {
    isOpen.value = false;
  };

  const notifyPurchased = () => {
    purchasedTick.value++;
  };

  return {
    isOpen,
    purchasedTick,
    openBuyCreditsModal,
    closeBuyCreditsModal,
    notifyPurchased,
  };
};
