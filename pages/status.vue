// pages/health-check.vue
<template>
  <section class="section">
    <div class="container">
      <h1 class="title">Nosana Network Status</h1>
      <table class="table is-striped is-fullwidth">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="service in services" :key="service.name">
            <td>{{ service.name }}</td>
            <td :class="service.status.class" class="status-cell">
              <span class="status-dot" :class="service.status.dotClass"></span>
              {{ service.status.text }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { sleep } from '@nosana/sdk';

const config = useRuntimeConfig().public


const statusMap = {
  Checking: { text: 'Checking...', class: 'has-text-info', dotClass: 'dot-checking' },
  Online: { text: 'Online', class: 'has-text-success', dotClass: 'dot-online' },
  Offline: { text: 'Offline', class: 'has-text-danger', dotClass: 'dot-offline' },
};
console.log(config.value);
const services = ref([
  { name: 'Dashboard', url: `https://dashboard.nosana.com/`, status: statusMap.Checking, method: 'GET' },
  { name: 'Grid Manager', url: `${config.apiBase}/api/nodes/available-gpus`, status: statusMap.Checking, method: 'GET' },
  { name: 'Job Indexer', url: `${config.apiBase}/api/nodes/available-gpus`, status: statusMap.Checking, method: 'GET' },
  { name: 'Solana RPC', url: config.rpcUrl, status: statusMap.Checking, method: 'POST' },
]);
const checkServiceStatus = async (service) => {
  try {
    await sleep(1);
    let response;
    if (service.method === 'GET') {
      response = await fetch(service.url);
    } else if (service.method === 'POST') {
      response = await fetch(service.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getHealth',
          params: []
        }),
      });
    }
    console.log(response);
    if (response.ok) {
      console.log(service.name)

      if (service.method === 'POST') {
        const result = await response.json();
        if (result.result !== 'ok') {
          service.status = statusMap.Offline;
        } else {
          service.status = statusMap.Online;
        }
      } else {
        service.status = statusMap.Online;
      }
    } else {
      service.status = statusMap.Offline;
    }
  } catch (error) {
    service.status = statusMap.Offline;
  }
};

const checkAllServices = () => {
  services.value.forEach((service) => checkServiceStatus(service));
};

checkAllServices();
</script>


<style scoped lang="scss">
.status-cell {
  width: 150px;
}

.status-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 8px;
}

.dot-checking {
  background-color: $info;
  animation: pulse 1.5s infinite;
}

.dot-online {
  background-color: $success;
}

.dot-offline {
  background-color: $danger;
}

@keyframes pulse {

  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.5;
  }
}
</style>
