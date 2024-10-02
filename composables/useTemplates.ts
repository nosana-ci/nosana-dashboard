import type { JobDefinition } from "@nosana/sdk"
const emptyJobDefinition: JobDefinition = {
  "version": "0.1",
  "type": "container",
  "meta": {
    "trigger": "job-builder"
  },
  "ops": [
    {
      "type": "container/run",
      "id": "",
      "args": {
        "image": "",
        "gpu": true
      }
    }
  ]
}

export type Template = {
  id: number | string;
  name: string;
  description: string;
  template: JobDefinition;
  category: string[];
  icon: string;
  created_at: string;
  updated_at: string;
  readme: string;
}

export const defaultTemplates: Template[] = [
    {
        "id": "hello-world",
        "name": "Hello World",
        "description": "Echo hello world",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI", "Featured"],
        "icon": "https://nosana.io/img/Nosana_Logomark_color.png",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# BLANK Template\n\nThis is a blank template, for Nosana Pipelines.\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n"
    },
    {
        "id": 177077,
        "name": "Clojure",
        "description": "Latest release of Clojure",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://upload.wikimedia.org/wikipedia/commons/5/5d/Clojure_logo.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Clojure Template\n\nThis template is for Clojure projects.\n\nThe template is based on the [Clojure Docker image](https://hub.docker.com/_/clojure/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\nIn this template, we also showcase how to install and use `clj-kondo`.\n"
    },
    {
        "id": 177078,
        "name": "Deno",
        "description": "The easiest, most secure JavaScript runtime.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://upload.wikimedia.org/wikipedia/commons/8/84/Deno.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Deno Template\n\nThis template is for Deno projects.\nShould help you get started with a Deno project.\n\nThe template is based on the [Deno Docker image](https://hub.docker.com/denoland/deno/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n"
    },
    {
        "id": 177079,
        "name": "docker",
        "description": "Docker is a platform designed to help developers build, share, and run modern applications.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://www.docker.com/wp-content/uploads/2022/03/vertical-logo-monochromatic.png",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Docker Template\n\nThis template is for docker projects.\nShould help you get started with a docker project.\n"
    },
    {
        "id": 177080,
        "name": "Go",
        "description": "Go (golang) is a general purpose, higher-level, imperative programming language.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://upload.wikimedia.org/wikipedia/commons/0/05/Go_Logo_Blue.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Go Template\n\nThis template is for Go projects.\n\nThe template is based on the [Go Docker image](https://hub.docker.com/_/golang/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n"
    },
    {
        "id": 177081,
        "name": "NPM",
        "description": "Node Package Manager. Node.js® is an open-source, cross-platform JavaScript runtime environment. ",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://upload.wikimedia.org/wikipedia/commons/d/db/Npm-logo.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# NPM Template\n\nThis template is for Node.JS projects.\nShould help you get started with a Node.JS project.\n\nThe template is based on the [Node.JS Docker image](https://hub.docker.com/_/node/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n\nThis template assumes you are using `npm` and that the run commands defined in the pipeline are defined in your `package.json` file.\n"
    },
    {
        "id": 177082,
        "name": "podman",
        "description": "Podman is a daemonless container engine for developing, managing, and running OCI Containers on your Linux System.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://github.com/containers/common/raw/main/logos/logo_circle_podman.png",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Podman Template\n\nThis template is for podman projects.\nShould help you get started with a podman project.\n"
    },
    {
        "id": 177083,
        "name": "Python",
        "description": "Python is an interpreted, interactive, object-oriented, open-source programming language.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Python-logo-notext.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Python Template\n\nThis template is for Python projects.\nPython is an interpreted, interactive, object-oriented, open-source programming language.\n\nThe template is based on the [Python Docker image](https://hub.docker.com/_/python/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n"
    },
    {
        "id": 177084,
        "name": "Rust",
        "description": "Rust is a systems programming language focused on safety, speed, and concurrency.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://upload.wikimedia.org/wikipedia/commons/d/d5/Rust_programming_language_black_logo.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Rust Template\n\nThis template is for Rust projects.\n\nThe template is based on the [Rust Docker image](https://hub.docker.com/_/rust/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n"
    },
    {
        "id": 177085,
        "name": "Solana Program Library",
        "description": "Pipeline for SPL",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://solana.com/nl/src/img/branding/solanaLogoMark.png",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# SPL Template\n\nThis template is for SPL projects.\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n"
    },
    {
        "id": 'squads',
        "name": "Squads Protocol",
        "description": "Squads simplifies management of developer and treasury assets for teams building on Solana and SVM",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://avatars.githubusercontent.com/u/84348534",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Squads Template\n\nThis template is for use with Squads, allowing you to do Multi Signature deployments for your Solana programs.\nThe pipeline will build your Solana program, run your tests, and deploy it to a buffer, it will then be ready for you on your Squads account to sign the deployment transaction.\n\nThis template uses an image created and maintained by Nosana, namely [`nosana/solana`](https://hub.docker.com/r/nosana/solana).\nIt includes tools to help with Solana development and delivery.\n\nIn this README, we will go through the steps needed to:\n\n- Deploy a [Solana Hello World Program](https://github.com/solana-labs/example-helloworld).\n- Set up a [Squads](https://squads.so/) account and hook in your deployed Solana program.\n- Set up your pipeline on Nosana to help with the testing and delivery of your Solana program.\n\n## Requirements\n\nWe will outline two options here, and we recommend the Docker option.\nDo note that we will be doing this on [Solana Devnet](https://docs.solana.com/clusters#devnet).\nThis allows you to experiment and play around with the pipeline before putting it into production.\n\n## Docker\n\nSpin up an interactive Docker container. Nosana has an image that you can use that includes all the dependencies you need to build, test, and deploy your Solana program.\nYou can then continue with the [Deploy the Initial Solana Program](#deploy-the-initial-solana-program) section of this README.\n\n```bash\ndocker run -it nosana/solana\n```\n\n## Standard\n\nIf you do not have Docker or do not want to use Docker, you will need to install the following dependencies to your system:\n\n- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools)\n- [Rust](https://www.rust-lang.org/tools/install)\n- [NodeJS](https://nodejs.org)\n- [Compatible Solana Wallet for Squads](https://v3.squads.so/connect-squad)\n\n## Deploy the Initial Solana Program\n\n<a href=\"https://asciinema.org/a/14?autoplay=1\"><img src=\"https://asciinema.org/a/14.png\" width=\"836\"/></a>\n\nWe will need to start by building and deploying an initial version of the smart contract to get started.\nClone the repo, `cd` into it, install the dependencies and build and deploy it.\n\n```bash\ngit clone git@github.com:nosana-ci/example-helloworld.git\ncd example-helloworld\n\nnpm ci\nnpm run build:program-c\n# OR\nnpm run build:program-rust\n\nsolana-keygen new # Keep track of this key and import it to your wallet.\n\nsolana airdrop 1 --url devnet\n\nsolana program deploy dist/program/helloworld.so --url devnet\n# => Program Id: <YourProgramId>\n```\n\nKeep track of this `ProgramID`; we will need it in a bit.\n\n## Squads.so\n\n[Squads.so](https://squads.so) simplifies the management of developer and treasury assets for teams building on Solana and SVM.\nThis allows you to create a team on Squads, import your Solana program, and ensure that any time you want to deploy an update, everyone will need to sign it.\n\n### Requirements (optional)\n\nDepending on your setup, you might need to import the key you used to deploy your Solana program into your wallet.\nYou should be able to find this file in: `$HOME/.config/solana/id.json`.\nCopy the contents of this file into your wallet's import key interface.\n\n### Setup\n\n1. Head over to [v3.squads.so](https://v3.squads.so/connect-squad)\n2. Connect your wallet using the Solana account you used to deploy your Solana program\n3. Click the `Create Squad` button and fill in the details.\n4. Add any other members that you want to be the initial multisig owners\n5. Review and confirm the creation of your squad\n6. After confirming, go to the `Programs` link in the sidebar\n7. Click the `+ Add program` button\n8. Add the name and `<YourProgramId>`\n9. You will be presented with a dialogue to upgrade the security, click the `initiate transaction` and sign the transaction\n10. Afterward, go to the `Transactions` item in the sidebar, and `execute` the transaction to finish the authority upgrade.\n11. Now go to the page of your newly added program, copy the URL, and cut the string after the last `/`\n    1. It will look like this: `https://devnet.squads.so/programs/<ABCDEFG...12345>/<12345...ABCDEFG>`\n    2. Copy the last piece of URL after the `/`\n    3. Keep it safe, we will need to use it later.\n\nNow we should have all the pieces in place to start setting up the multisig transactions on Nosana.\n\n## Nosana\n\n1. Fork the repository from https://github.com/solana-labs/example-helloworld to your GitHub account\n2. Go to [app.nosana.io](https://app.nosana.io)\n3. Sign up and import the fork of the `solana-labs/example-helloworld` to your Nosana account\n4. When you are presented with choosing a template, choose the Squads one\n5. In the `environment` object, add the respective keys to the following properties:\n   1. AUTHORITY_PUBKEY: <Your-PubKey-Here>\n   2. MULTISIG_PUBKEY: <Your-PubKey-Here>\n   3. SQUADS_PUBKEY: <Your-PubKey-Here>\n6. Go to `Secrets`\n   1. Click `new secret`\n   2. Add your key to the `secret` field\n   3. Name it `SOLANA_WALLET`\n7. Go back and `Commit Changes`\n8. Make sure everything is correct for your pipeline.\n\nNow, every time you make a change to your Solana program, every commit that is pushed back to the `main` branch will trigger a Nosana pipeline to run.\nThis will create a new transaction for you in the [Squads.so](https://devnet.squads.so) interface that you can execute.\nAfter you execute it, the rest of your team will also need to sign the transaction in Squads in order for the deployment to happen.\n\nCongrats! Your Solana program is no longer vulnerable to the issue of having a single upgrade authority.\n"
    },
    {
        "id": 177087,
        "name": "Yarn",
        "description": "Yarn, Node.js® is an open-source, cross-platform JavaScript runtime environment.",
        "template": {
          "version": "0.1",
          "type": "container",
          "meta": {
            "trigger": "job-builder"
          },
          "ops": [
            {
              "type": "container/run",
              "id": "hello-world",
              "args": {
                "cmd": "echo hello world",
                "image": "ubuntu"
              }
            }
          ]
        },
        "category": ["GPU", "AI"],
        "icon": "https://raw.githubusercontent.com/yarnpkg/assets/master/yarn-kitten-circle.svg",
        "created_at": "2024-10-01T09:00:05.597Z",
        "updated_at": "2024-10-01T09:00:05.597Z",
        "readme": "# Node.JS Template\n\nThis template is for Node.JS projects.\nShould help you get started with a Node.JS project.\n\nThe template is based on the [Node.JS Docker image](https://hub.docker.com/_/node/).\n\nYou can define your ENV variables in the `global` property of the template.yml file.\n\nIn the `commands` property, this is a property called `commands`. In `commands`, you will see the basic commands that are needed to install, build and test your project.\n\nThis template assumes you are using `yarn` and that the run commands defined in the pipeline are defined in your `package.json` file.\n"
    }
]

const templates: Ref<Template[]> = ref(defaultTemplates);

export const useTemplates = () => {
  return { templates, emptyJobDefinition };
};
