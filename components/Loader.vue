<template>
  <div class="spinner-container">
    <div class="spinner-bg"></div>
    <div class="half-circle-spinner">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
    </div>
  </div>
</template>
<style lang="scss" scoped>
.half-circle-spinner,
.half-circle-spinner * {
  box-sizing: border-box;
}

.spinner-bg {
  position: fixed;
  top: 0; left: 0; bottom: 0; right: 0;
  background-color: rgba(255, 255, 255, 0.7);
  z-index: 99;
}

.half-circle-spinner {
  width: 60px;
  height: 60px;
  border-radius: 100%;
  position: absolute;
  top: 0; left: 0; bottom: 0; right: 0;
  z-index: 100;
  margin: auto;
}

.half-circle-spinner .circle {
  content: "";
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 100%;
  border: calc(60px / 10) solid transparent;
}

.half-circle-spinner .circle.circle-1 {
  border-top-color: $secondary;
  animation: half-circle-spinner-animation 1s infinite;
}

.half-circle-spinner .circle.circle-2 {
  border-top-color: $secondary;
  animation: half-circle-spinner-animation 1s infinite alternate;
}

@keyframes half-circle-spinner-animation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
