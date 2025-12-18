<template>
  <div>
    <TopBar
      :title="'Support'"
      :subtitle="'Your Hub for Solutions'"
      ref="topBar"
      v-model="showSettingsModal"
    />

    <div class="box has-background-white-ter">
      <div class="columns">
        <div class="column is-4">
          <div class="box">
            <h4 class="title is-4">Discord Community</h4>
            <p class="is-size-5">
              Connect with our community for prompt, personalized support for deployments and setting up your host.
              <br />
              <a
                href="https://discord.gg/nosana-ai"
                target="_blank"
                class="button mt-4 is-primary is-outlined"
              >
                <span class="icon is-small">
                  <DiscordIcon style="height: 1em" />
                </span>
                <span>Discord</span>
              </a>
            </p>
          </div>
        </div>
        <div class="column is-4">
          <div class="box">
            <h4 class="title is-4">Documentation</h4>
            <p class="is-size-5">
              Explore our comprehensive guides and learn how the Nosana 
              network works with detailed examples and tutorials.
              <br />
              <a
                href="https://learn.nosana.com/"
                target="_blank"
                class="button mt-4 is-primary is-outlined"
              >
                <span class="icon is-small">
                  <ExplorerIcon style="height: 1em" />
                </span>
                <span>Documentation</span>
              </a>
            </p>
          </div>
        </div>
        <div class="column is-4">
          <div class="box">
            <h4 class="title is-4">GitHub</h4>
            <p class="is-size-5">
              We pride ourselves on being open-source. Visit our GitHub
              repository to contribute, build, and report technical issues.<br />
              <a
                href="https://github.com/nosana-ci"
                target="_blank"
                class="button mt-4 is-primary is-outlined"
              >
                <span class="icon is-small">
                  <GithubIcon style="height: 1.1em" />
                </span>
                <span>GitHub</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import GithubIcon from "@/assets/img/icons/github.svg?component";
import DiscordIcon from "@/assets/img/icons/discord.svg?component";
import ExplorerIcon from "@/assets/img/icons/sidebar/explorer.svg?component";
const showSettingsModal = ref(false);
</script>

<style lang="scss" scoped>
</style>
