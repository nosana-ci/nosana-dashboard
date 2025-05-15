<template>
  <section class="section">
    <div class="container mt-5">
      <h1 class="title is-2">DBW Nosana Hackathon</h1>
      <p class="subtitle">
        Enter your email address to check if you are registered for the
        hackathon and to receive further instructions.
      </p>

      <div class="field" style="max-width: 330px;">
        <div class="control">
          <input
            id="email-input"
            class="input"
            type="email"
            placeholder="e.g., yourname@example.com"
            v-model="email"
          />
        </div>
      </div>

      <div class="field">
        <div class="control">
          <button
            class="button is-secondary"
            @click="checkEmail"
            :disabled="isLoading"
          >
            {{ isLoading ? "Checking..." : "Check Email" }}
          </button>
          <button
            class="button is-secondary ml-2 is-outlined"
            @click="requestAirdrop"
            :disabled="isLoading"
          >
            {{ isLoading ? "Processing..." : "Request Airdrop" }}
          </button>
        </div>
      </div>

      <div
        v-if="responseMessage"
        class="notification"
        :class="messageType === 'success' ? 'is-success' : 'is-danger'"
      >
        {{ responseMessage }}
      </div>

      <div class="box has-background-white-ter mt-6">
        <div class="columns">
          <div class="column is-4">
            <div class="box">
              <h4 class="title is-4">Link Your Key to the CLI</h4>
              <p class="is-size-5">
                Easily connect your key to the Nosana CLI to enable seamless deployments from your terminal.
<br>
                <br />
                <a
                  href="https://discord.gg/nosana-ai"
                  target="_blank"
                  class="button mt-4 is-primary is-outlined"
                >
                  <span>Guide for CLI</span>
                  <span class="icon is-small">
                    <img src="@/assets/img/icons/arrow-right.svg" style="height: 8px;" class="ml-1">
                  </span>
                </a>
              </p>
            </div>
          </div>
          <div class="column is-4">
            <div class="box">
              <h4 class="title is-4">Link Your Key to the SDK</h4>
              <p class="is-size-5">
                Integrate Nosana's features directly into your codebase by linking your key to the SDK—perfect for developers automating workflows.

                <br />
                <a
                  href="https://docs.nosana.com/about/intro.html"
                  target="_blank"
                  class="button mt-4 is-primary is-outlined"
                >
                  <span>Guide for SDK</span>
                  <span class="icon is-small">
                    <img src="@/assets/img/icons/arrow-right.svg" style="height: 8px;" class="ml-1">
                  </span>
                </a>
              </p>
            </div>
          </div>
          <div class="column is-4">
            <div class="box">
              <h4 class="title is-4">Link Your Key to the UI</h4>
              <p class="is-size-5">
                Use Nosana's interface with your key for intuitive configuration, monitoring, and control—no coding needed.
                <br />
                <a
                  href="https://github.com/nosana-ci"
                  target="_blank"
                  class="button mt-4 is-primary is-outlined"
                >
                  <span>Guide for UI</span>
                  <span class="icon is-small">
                    <img src="@/assets/img/icons/arrow-right.svg" style="height: 8px;" class="ml-1">
                  </span>
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref } from "vue";

const config = useRuntimeConfig().public;
const email = ref("");
const responseMessage = ref("");
const messageType = ref("");
const isLoading = ref(false);

const checkEmail = async () => {
  if (!email.value) {
    responseMessage.value = "Please enter an email address.";
    messageType.value = "error";
    return;
  }
  isLoading.value = true;
  responseMessage.value = "";
  messageType.value = "";

  try {
    const response = await fetch(
      config.apiBase + "/api/hackathon/check-email",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.value,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      if (data.exists) {
        responseMessage.value = data.message;
        messageType.value = "success";
      } else {
        responseMessage.value =
          "This email is not registered for the hackathon.";
        messageType.value = "error";
      }
    } else {
      responseMessage.value =
        data.message || "An error occurred. Please try again.";
      messageType.value = "error";
    }
  } catch (error) {
    console.error("Error checking email:", error);
    responseMessage.value = "An error occurred. Please try again.";
    messageType.value = "error";
  } finally {
    isLoading.value = false;
  }
};

const requestAirdrop = async () => {
  if (!email.value) {
    responseMessage.value = "Please enter an email address.";
    messageType.value = "error";
    return;
  }
  isLoading.value = true;
  responseMessage.value = "";
  messageType.value = "";

  try {
    const response = await fetch(
      config.apiBase + "/api/hackathon/request-airdrop",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.value,
        }),
      }
    );

    const data = await response.json();

    if (response.ok) {
      responseMessage.value = data.message;
      messageType.value = "success";
    } else {
      responseMessage.value =
        data.message || "An error occurred. Please try again.";
      messageType.value = "error";
    }
  } catch (error) {
    console.error("Error requesting airdrop:", error);
    responseMessage.value = "An error occurred. Please try again.";
    messageType.value = "error";
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped lang="scss">
.notification {
  margin-top: 20px;
}
</style>
