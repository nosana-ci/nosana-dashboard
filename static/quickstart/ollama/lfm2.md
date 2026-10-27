![image.png](https://ollama.com/assets/library/lfm2/ddca3f1a-b232-44eb-ba95-236f15edd6a6)

LFM2 is a family of hybrid models designed for on-device deployment. LFM2-24B-A2B is the largest model in the family, scaling the architecture to 24 billion parameters while keeping inference efficient.

- **Best-in-class efficiency**: A 24B MoE model with only 2B active parameters per token, fitting in 32 GB of RAM for deployment on consumer laptops and desktops.
- **Fast edge inference**: 112 tok/s decode on AMD CPU, 293 tok/s on H100. Fits in 32B GB of RAM.
- **Predictable scaling**: Quality improves log-linearly from 350M to 24B total parameters, confirming the LFM2 hybrid architecture scales reliably across nearly two orders of magnitude.

![image.png](https://ollama.com/assets/library/lfm2/276ea517-7960-43b4-bc4d-d0d2dcbaf97b)
