<template>
  <div>
    <section class="section mt-5">
      <div class="container">
        <h2 class="title is-2 mt-5 mb-0">
          Your Hub for Solutions
        </h2>
        <div class="columns">
          <div class="columns my-6 pt-6">
            <div class="column is-4" data-aos="fade-in">
              <div class="has-radius p-5" style="background-color: #f7f7f7">
                <h4 class="title is-4 p-2 mb-2">
                  Get 1-on-1 Support
                </h4>
                <p class="mb-5 is-size-5 p-2" style="color: #666">
                  Receive prompt, personalized support for staking or wallet issues from our dedicated support team.<br>
                  <a href="https://discord.gg/KFNu8Skx8T" target="_blank" class="button mt-4">
                    <img src="~/assets/img/icons/discord.svg" style="width: 16px; margin-right: 8px;">Support
                  </a>
                </p>
              </div>
            </div>
            <div class="column is-4" data-aos="fade-in">
              <div class="has-radius p-5" style="background-color: #f7f7f7">
                <h4 class="title is-4 p-2 mb-2">
                  GitHub
                </h4>
                <p class="mb-5 is-size-5 p-2" style="color: #666">
                  We pride ourselves on being open-source. Visit our GitHub repository to contribute,
                  build, and report technical issues.<br>
                  <a href="https://github.com/nosana-ci" target="_blank" class="button mt-4">
                    <img src="~/assets/img/icons/github.svg" style="width: 18px; margin-right: 8px;">GitHub
                  </a>
                </p>
              </div>
            </div>
            <div class="column is-4" data-aos="fade-in">
              <div class="has-radius p-5" style="background-color: #f7f7f7">
                <h4 class="title is-4 p-2 mb-2">
                  Connect
                </h4>
                <p class="mb-5 is-size-5 p-2" style="color: #666">
                  Our server is where you can connect with others, chat, and interact with team members.<br>
                  <a href="https://discord.gg/nosana-ai" target="_blank" class="button mt-4">
                    <img src="~/assets/img/icons/discord.svg" style="width: 16px; margin-right: 8px;">Discord
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section has-background-grey-lighter">
      <div class="container">
        <div class="columns">
          <div class="column is-10 is-horizontal-centered mb-6">
            <h3 class="title is-2">
              Frequently Asked Questions
            </h3>
            <accordion>
              <accordion-item v-for="faq in faqs" :key="faq.question">
                <!-- This slot will handle the title/header of the accordion and is the part you click on -->
                <template slot="accordion-trigger">
                  <h3 class="title is-3 mb-0 has-text-weight-semibold">
                    {{ faq.question }}
                  </h3>
                </template>
                <!-- This slot will handle all the content that is passed to the accordion -->
                <template slot="accordion-content">
                  <!-- eslint-disable vue/no-v-html -->
                  <span v-html="faq.answer" />
                </template>
              </accordion-item>
            </accordion>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  colorMode: 'light',
  data () {
    return {
      faqs: [
        {
          question: 'What is Nosana?',
          answer:
            'Nosana is a peer-to-peer compute marketplace that offers on-demand GPU access for AI projects. It connects AI companies and developers with a global network of compute providers, enabling efficient and scalable computing solutions.'
        },
        {
          question: 'What is the contract address of Nosana’s token and the max supply?',
          answer:
            'The contract address is <code>nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7</code>, and the total fixed supply is 100,000,000 $NOS. For detailed information and tokenomics, please refer to <a href="https://docs.nosana.com/" target="_blank">our docs</a>'
        },
        {
          question: 'How does the staking program work?',
          answer:
            'When you stake NOS, you select an unstake duration ranging from 14 to 365 days. Your tokens are staked indefinitely, and you earn rewards during this period. When you initiate the unstake process, your chosen unstake duration begins. Once unstaked, you stop earning rewards, and your staked tokens are released to you linearly over the duration you selected. You can claim your released tokens at any time. Once you choose an unstake duration for your wallet, it cannot be changed. If you lose access to your wallet or it gets compromised, we cannot assist with token recovery. Please ensure you practice wallet safety to protect your stake. The staking APY is dynamic and depends on your stake, unstake duration, and other stakers in the reward pool. To view the current APY, stake your tokens, and claim rewards, visit our <a href="https://explorer.nosana.io/stake" target="_blank">Staking Dashboard</a>.'
        },
        {
          question: 'I need help with staking or another issue. How do I get assistance?',
          answer:
            'For support with staking, claiming $NOS, or any other personal issue, please join our Discord server and open a support ticket. You can access our help and support section <a href="https://discord.gg/KFNu8Skx8T" target="_blank">here</a>.'
        },
        {
          question: 'I need to connect with the team about a partnership, collaboration, listing, proposal, or job offer. Who should I contact?',
          answer:
            'Please email us at team@nosana.io. We monitor this inbox closely and will respond promptly.'
        },
        {
          question: 'I received an airdrop of $aNOS; is this legitimate?',
          answer:
            'No, $aNOS is not affiliated with us, and we do not conduct airdrops. Please verify the contract address. Our $NOS token has the contract address <code>nosXBVoaCTtYdLvKY6Csb4AC8JCdQKKAaWYtx2ZMoo7</code>.'
        },
        {
          question: 'What wallets are compatible with $NOS? Can I use my Ledger?',
          answer:
            'We recommend <a href="https://phantom.app/" target="_blank">Phantom</a> and <a href="https://solflare.com/" target="_blank">Solflare</a>. You can use your Ledger device by connecting it to Phantom or Solflare and performing transactions within the wallet, confirming on your Ledger device.'
        }
      ]
    };
  }
};
</script>

<style lang="scss" scoped>
.button {
  &:hover {
    background-color: #f9f9f9;
    color: #333 !important;
  }
}
@media screen and (max-width: $tablet) {
  .columns.my-6 {
    margin-top: 0 !important;
    margin-bottom: 0 !important;
  }
  .mt-5 {
    margin-top: 0 !important;
  }
  .has-radius.p-6 {
    padding-left: 24px !important;
    padding-right: 24px !important;
  }
}
</style>
