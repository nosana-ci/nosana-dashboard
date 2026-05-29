export const useBuyCreditsModal = () => {
  const isOpen = useState("buyCreditsModalOpen", () => false);
  const purchasedTick = useState("buyCreditsPurchasedTick", () => 0);

  const openBuyCreditsModal = () => {
    isOpen.value = true;
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
