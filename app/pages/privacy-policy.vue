<template>
  <div>
    <TopBar :title="'Privacy Policy'" :subtitle="'How Nosana collects, uses, and protects your data'" ref="topBar"
      v-model="showSettingsModal" />

    <div class="box has-background-white-ter">
      <div class="content">
        <!-- <p><strong>Effective date:</strong> {{ effectiveDate }}</p> -->

        <p>
          This Privacy Policy describes how <strong>Nosana</strong> ("we", "us", or
          "our") collects, uses, discloses, and safeguards information when you use the
          Nosana dashboard, websites, and related services (collectively, the "Services").
        </p>

        <h3>Information we collect</h3>
        <ul>
          <li>
            <strong>Account and wallet information:</strong> details you provide or connect,
            such as a username, email (if applicable), and public wallet address.
          </li>
          <li>
            <strong>Usage data:</strong> logs related to how you interact with the Services,
            including pages viewed, device/browser type, and approximate location derived
            from IP address.
          </li>
          <li>
            <strong>Cookies and similar technologies:</strong> used to remember preferences
            and improve performance. You can control cookies via your browser settings.
          </li>
        </ul>

        <h3>How we use information</h3>
        <ul>
          <li>Provide, operate, and maintain the Services.</li>
          <li>Improve and personalize the user experience.</li>
          <li>Monitor usage, performance, and security.</li>
          <li>Communicate important updates and respond to support requests.</li>
          <li>Comply with legal obligations and enforce our terms and policies.</li>
        </ul>

        <h3>Legal bases for processing</h3>
        <p>
          We process personal data where necessary to perform a contract with you, based on
          our legitimate interests in operating and securing the Services, with your
          consent, and/or to comply with legal obligations.
        </p>

        <h3>Sharing and disclosures</h3>
        <p>
          We do not sell personal data. We may share information with trusted service
          providers that help us operate the Services (e.g., hosting, analytics), subject
          to appropriate safeguards; to comply with law or legal processes; to protect the
          rights, property, or safety of Nosana, our users, or the public; or with your
          direction or consent.
        </p>

        <h3>Data retention</h3>
        <p>
          We retain information for as long as necessary to provide the Services, comply
          with our legal obligations, resolve disputes, and enforce agreements. Retention
          periods may vary depending on the type of data and applicable requirements.
        </p>

        <h3>Your rights</h3>
        <p>
          Depending on your location, you may have rights to access, rectify, delete, or
          restrict the processing of your personal data, as well as the right to data
          portability and to object to certain processing. You may also withdraw consent at
          any time where processing is based on consent. To exercise these rights, please
          contact us using the details below.
        </p>

        <h3>International transfers</h3>
        <p>
          If we transfer personal data across borders, we do so using appropriate
          safeguards, such as standard contractual clauses or equivalent mechanisms, as
          required by applicable law.
        </p>

        <h3>Security</h3>
        <p>
          We implement technical and organizational measures designed to protect your
          information. However, no method of transmission or storage is completely secure,
          and we cannot guarantee absolute security.
        </p>

        <h3>Children’s privacy</h3>
        <p>
          Our Services are not directed to children under 13 (or other age as required by
          local law). We do not knowingly collect personal data from children. If you
          believe a child has provided us with personal data, please contact us so we can
          take appropriate action.
        </p>

        <h3>Changes to this policy</h3>
        <p>
          We may update this Privacy Policy from time to time. We will post the updated
          version on this page and update the effective date above. Your continued use of
          the Services after changes become effective constitutes acceptance of the updated
          policy.
        </p>

        <h3>Contact</h3>
        <p>
          If you have questions about this policy or our data practices, please reach out
          via the <a href="/support">Support</a> page or through our community channels.
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
