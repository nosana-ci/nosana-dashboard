# Nosana Dashboard

The Nosana Dashboard is a useful tool to easily access relevant information for current node operators and also for people interested in becoming a node operator.

In the Nosana Dashboard you can easily access the following information:

- Completed Jobs
- Running Jobs
- Queued Jobs
- Total Inference Hours
- Online GPU Nodes

This Information allows users to better understand Nosana's contribution to servicing real, live demand for inference in a highly reliable and performant way.

![image](https://github.com/user-attachments/assets/4fd91dc0-6fd8-429a-9516-2809977b6bfc)
Link to the [Nosana Explorer] website: (https://dashboard.nosana.com).


Nosana's Dashboard also features useful information such as Test Grid Markets which shows what kind of hardware is being used the most by the current GPU demand. This can help new users understanf if the hardware they own has a high or a low demand by the market.

![Nosana Testgrid Markets](https://github.com/user-attachments/assets/c9e7cf59-cfe2-4e21-839e-9bb7cfc524f6)


## Build Setup

Make sure to install the dependencies:

```bash
# install dependencies
npm ci

# Start the development server on `http://localhost:3000`:
npm run dev

# Or build the application for production:
npm run generate

# Preview the production build
npx http-server .output/public
```
