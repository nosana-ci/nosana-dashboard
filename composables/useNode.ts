// composables/useNodeInfo.ts
import { ref, computed, onMounted } from 'vue';
import { PublicKey } from '@solana/web3.js';

export function useNode(nodeId: string) {
  const address = ref<string | null>(null);
  const balance = ref<any | null>(null);
  const solBalance = ref<any | null>(null);
  const nosStaked = ref<any | null>(null);
  const nodeSpecs = ref<any | null>(null);
  const nodeStatus = ref<any | null>(null);
  const nodeInfo = ref<any | null>(null);
  const jobs = ref<any | null>(null);

  const { nosana } = useSDK();
  const { markets, getMarkets } = useMarkets();

  const nodeSpecsUrl = computed(() => `/api/nodes/${nodeId}/specs`);
  const { data: fetchedNodeSpecs } = useAPI(nodeSpecsUrl, { 
    watch: [nodeSpecsUrl],
    default: () => null
  });

  const { data: fetchedNodeInfo } = useFetch(`https://${String(nodeId)}.node.k8s.prd.nos.ci/node/info`);

  onMounted(async () => {
    try {
      const pk = new PublicKey(nodeId);
      address.value = pk.toString();

      balance.value = await nosana.value.solana.getNosBalance(address.value);
      solBalance.value = await nosana.value.solana.getSolBalance(address.value);
      nosStaked.value = await nosana.value.stake.get(address.value);

      nodeSpecs.value = fetchedNodeSpecs.value;
      nodeInfo.value = fetchedNodeInfo.value;

      const nodesInMarkets = markets.value?.flatMap((market) => {
        return market.queueType === 1
          ? market.queue.map((data: any) => data.toString())
          : [];
      });

      if (nodesInMarkets?.includes(address.value)) {
        nodeStatus.value = 'QUEUED';
      }

      const nodeRuns = await nosana.value.jobs.getRuns([
        {
          memcmp: {
            offset: 40,
            bytes: nodeId,
          },
        },
      ]);

      if (nodeRuns && nodeRuns.length) {
        nodeStatus.value = 'RUNNING';
      }
    } catch (error) {
      console.error('Error fetching node data', error);
    }
  });

  return {
    address,
    balance,
    solBalance,
    nosStaked,
    nodeSpecs,
    nodeStatus,
    nodeInfo,
  };
}