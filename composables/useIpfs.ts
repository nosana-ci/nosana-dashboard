import { useIDBKeyval } from '@vueuse/integrations/useIDBKeyval';
import { get } from 'idb-keyval';
const { nosana } = useSDK();
const ipfsList: Ref<any> = useLocalStorage('ipfs', {});

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
    return ipfsData
      ? (JSON.parse(JSON.stringify(ipfsData)) as Object)
      : ipfsData;
  } catch (e) {
    console.error(e);
  }
};

export const useIpfs = () => {
  return { ipfsList, getIpfs };
};
