import { useToast } from "vue-toastification";
const toast = useToast();

export const useMyAsyncData = (
  key: string,
  callable: CallableFunction,
  opts?: { [key: string]: any }
) => {
  const asyncData = useLazyAsyncData(
    key,
    async () => {
      try {
        return await callable();
      } catch (error: any) {
        console.error(error);
        if (opts?.disableToastOnError === false) {
          toast.error(error.toString());
        }
        throw error;
      }
    },
    {
      server: false,
      ...opts,
    }
  );
  return asyncData;
};
