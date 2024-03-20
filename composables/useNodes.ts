import countries from '@/static/countries.json';

const getFlagEmoji = (countryCode: any) => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char: any) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
};

const nodes: Ref<Array<any> | undefined> = ref(undefined);

const { nosana, network } = useSDK();

watch(network, () => {
  nodes.value = undefined;
  getNodes();
});

const loadingNodes = ref(false);

const getNodes = async () => {
  console.log('retrieving all nodes..');
  loadingNodes.value = true;
  try {
    let nodeList = (await nosana.value.nodes.all()) as any[];
    nodeList = nodeList.map((node) => {
      try {
        const country = countries.find(
          (c: any) => c.number === node.country.toString(),
        );
        node.countryCode = node.country;
        node.country = country!.name;
        node.flag = getFlagEmoji(country!.code);
      } catch (e) {
        node.country = null;
      }
      return node;
    });
    nodes.value = nodeList;
  } catch (e) {
    console.error(e);
  }
  loadingNodes.value = false;
};
getNodes();

export const useNodes = () => {
  return { nodes, getNodes, loadingNodes };
};
