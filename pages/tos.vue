<template>
  <div>
    <TopBar :title="'Terms of Service'" :subtitle="'Please read these terms carefully before using Nosana'" ref="topBar"
      v-model="showSettingsModal" />

    <div class="box has-background-white-ter">
      <div class="content">
        <!-- <p><strong>Effective date:</strong> {{ effectiveDate }}</p> -->

        <p>
          These Terms of Service ("Terms") govern your access to and use of
          the services provided by <strong>Nosana</strong> ("Nosana", "we",
          "us", or "our"), including the Nosana dashboard, websites, and
          related services (collectively, the "Services"). By accessing or
          using the Services, you agree to be bound by these Terms.
        </p>

        <h3>1. Acceptance of terms</h3>
        <p>
          By using the Services, you affirm that you have read, understood, and
          agree to be bound by these Terms. If you do not agree, do not use the
          Services.
        </p>

        <h3>2. Changes to the services and terms</h3>
        <p>
          We may modify the Services and these Terms at any time. We will post
          updates to this page and update the effective date above. Your
          continued use of the Services after changes become effective
          constitutes acceptance of the updated Terms.
        </p>

        <h3>3. Eligibility</h3>
        <p>
          You must be at least the age of majority in your jurisdiction to use
          the Services. By using the Services, you represent and warrant that
          you meet this requirement.
        </p>

        <h3>4. Accounts and wallets</h3>
        <p>
          Some features may require connecting a supported wallet or creating an
          account. You are responsible for maintaining the confidentiality of
          your credentials and for all activities under your account or wallet.
          Nosana does not have access to your private keys.
        </p>

        <h3>5. Use of the services</h3>
        <ul>
          <li>You will comply with all applicable laws and regulations.</li>
          <li>You will not misuse, disrupt, or interfere with the Services.</li>
          <li>
            You will not attempt to gain unauthorized access to any systems or
            data.
          </li>
          <li>
            You are solely responsible for the content and actions you
            undertake while using the Services.
          </li>
        </ul>

        <h3>6. Fees</h3>
        <p>
          Certain features may involve fees. When applicable, fees, rates, and
          billing terms will be presented prior to use. You are responsible for
          any taxes associated with your use of the Services.
        </p>

        <h3>7. Intellectual property</h3>
        <p>
          The Services may include content owned by Nosana or third parties.
          Except as expressly permitted, you may not copy, modify, distribute,
          sell, or lease any part of the Services.
        </p>

        <h3>8. Open source software and license</h3>
        <p>
          Parts of the Services are made available under open source licenses.
          Please review our LICENSE for details:
          <a href="https://github.com/nosana-ci/nosana-dashboard/blob/main/LICENSE" target="_blank"
            rel="noopener noreferrer">Nosana Dashboard LICENSE</a>.
        </p>

        <h3>9. Prohibited conduct</h3>
        <ul>
          <li>Infringing the rights of others.</li>
          <li>Uploading or transmitting malicious code.</li>
          <li>Using the Services for unlawful, harmful, or fraudulent activity.</li>
          <li>Circumventing security or access controls.</li>
        </ul>

        <h3>10. Third-party services</h3>
        <p>
          The Services may link to or integrate with third-party services.
          Nosana does not control and is not responsible for those services.
          Your use of third-party services is subject to their terms and
          policies.
        </p>

        <h3>11. Disclaimers</h3>
        <p>
          THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
          WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING ANY WARRANTIES
          OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR
          NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICES WILL BE
          UNINTERRUPTED, SECURE, OR ERROR-FREE.
        </p>

        <h3>12. Limitation of liability</h3>
        <p>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, NOSANA WILL NOT BE LIABLE FOR
          ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES,
          OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR
          INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
          LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF THE SERVICES.
        </p>

        <h3>13. Indemnification</h3>
        <p>
          You agree to defend, indemnify, and hold harmless Nosana and its
          affiliates from and against any claims, liabilities, damages, losses,
          and expenses, including reasonable legal and accounting fees, arising
          out of or in any way connected with your use of the Services or your
          violation of these Terms.
        </p>

        <h3>14. Termination</h3>
        <p>
          We may suspend or terminate your access to the Services at any time,
          with or without notice, for any reason, including if we believe you
          have violated these Terms.
        </p>

        <h3>15. Governing law</h3>
        <p>
          These Terms are governed by the laws applicable in the jurisdiction
          where Nosana operates, without regard to its conflict of law
          provisions. Where permitted, disputes shall be resolved in the courts
          of that jurisdiction.
        </p>

        <h3>16. Changes to these terms</h3>
        <p>
          We may update these Terms from time to time. We will post the updated
          version on this page and update the effective date above. Your
          continued use of the Services after changes become effective
          constitutes acceptance of the updated Terms.
        </p>

        <h3>17. Contact us</h3>
        <p>
          If you have questions about these Terms, please contact us via the
          <a href="/support">Support</a> page or our community channels.
        </p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'
import TopBar from "~/components/TopBar.vue"

const showSettingsModal = ref(false)
const effectiveDate = computed(() => new Date().toISOString().slice(0, 10))
</script>

<style lang="scss" scoped></style>
