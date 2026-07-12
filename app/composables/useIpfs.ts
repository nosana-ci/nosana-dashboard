import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { get } from 'idb-keyval';

const ipfsList: Ref<any> = useLocalStorage('ipfs', {});

export const useIpfs = () => {
  const { nosana } = useKit();
  
  const getIpfs = async (hash: string) => {
    try {
      let ipfsData = await get(hash);
      if (!ipfsData) {
        console.log('retrieving from ipfs', hash);
        ipfsData = await nosana.value.ipfs.retrieve(hash);
        useIDBKeyval(hash, ipfsData);
      } else {
        console.log('retrieving from IDB', hash);
      }
      return ipfsData;
    } catch (e) {
      console.error(e);
    }
  };

  return { ipfsList, getIpfs };
};
