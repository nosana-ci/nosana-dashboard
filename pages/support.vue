<template>
  <div>
    <TopBar :title="'Support'" :subtitle="'Your Hub for Solutions'" />

    <div class="box has-background-white-ter">
      <div class="columns">
        <div class="column is-4">
          <div class="box">
            <h4 class="title is-4">
              Get 1-on-1 Support
            </h4>
            <p class="is-size-5">
              Receive prompt, personalized support for staking, wallet issues, or help with posting jobs from our
              dedicated support team.<br>
              <a href="https://discord.gg/KFNu8Skx8T" target="_blank" class="button mt-4 is-primary is-outlined">
                <span class="icon is-small">
                  <DiscordIcon style="height:1em" />
                </span>
                <span>Support</span>
              </a>
            </p>
          </div>
        </div>
        <div class="column is-4">
          <div class="box">
            <h4 class="title is-4">
              GitHub
            </h4>
            <p class="is-size-5">
              We pride ourselves on being open-source. Visit our GitHub repository to contribute,
              build, and report technical issues.<br>
              <a href="https://github.com/nosana-ci" target="_blank" class="button mt-4 is-primary is-outlined">
                <span class="icon is-small">
                  <GithubIcon style="height:1.1em" />
                </span>
                <span>GitHub</span>
              </a>
            </p>
          </div>
        </div>
        <div class="column is-4">
          <div class="box">
            <h4 class="title is-4">
              Connect
            </h4>
            <p class="is-size-5">
              Our server is where you can connect with others, chat, and interact with team and other community
              members.<br>
              <a href="https://discord.gg/nosana-ai" target="_blank" class="button mt-4 is-primary is-outlined">
                <span class="icon is-small">
                  <DiscordIcon style="height:1em" />
                </span>
                <span>Discord</span>
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import GithubIcon from '@/assets/img/icons/github.svg?component';
import DiscordIcon from '@/assets/img/icons/discord.svg?component';
</script>

<style lang="scss" scoped></style>
