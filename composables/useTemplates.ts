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
  readme: string;
}

export const defaultTemplates: Template[] = [
    {
        "id": "hello-world",
        "name": "Hello World",
        "description": "Echo hello world in a ubuntu docker container",
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
                "image": "ubuntu",
                "gpu": true
              }
            }
          ]
        },
        "category": ["Featured"],
        "icon": "https://nosana.io/img/Nosana_Logomark_color.png",
        "readme": "# Hello World Template\n\nThis is a simple template that prints hello world with the 'ubuntu' docker image.\n"
    },
    {
      "id": "jupyter-notebook",
      "name": "Jupyter Notebook",
      "description": "Jupyter Notebook Service",
      "template": {
        "version": "0.1",
        "type": "container",
        "meta": {
          "trigger": "job-builder"
        },
        "ops": [
          {
            "type": "container/run",
            "id": "jupyter-notebook",
            "args": {
              "cmd": "source /etc/bash.bashrc && jupyter notebook --notebook-dir=/tf --ip 0.0.0.0 --no-browser --allow-root --NotebookApp.token='' --NotebookApp.password=''",
              "expose": 8888,
              "image": "tensorflow/tensorflow:latest-gpu-jupyter",
              "gpu": true
            }
          }
        ]
      },
      "category": ["GPU", "Featured", "Service"],
      "icon": "https://seeklogo.com/images/J/jupyter-logo-A91705F539-seeklogo.com.png",
      "readme": "# Jupyter Notebook Template\n\n![Open WebUI](/img/examples/jupyter.gif)\n\nHarness the power of Nosana Endpoint to seamlessly run Jupyter Notebooks and connect via a user-friendly web interface. With access to GPU-backed nodes, you can conduct your experiments efficiently and cost-effectively, unlocking new possibilities for your research and data analysis\n"
  },
  {
    "id": "open-webui",
    "name": "Open WebUI",
    "description": "Open WebUI supports various LLM runners",
    "template": {
      "version": "0.1",
      "type": "container",
      "meta": {
        "trigger": "job-builder"
      },
      "ops": [
        {
          "type": "container/run",
          "id": "open-webui",
          "args": {
            "cmd": [],
            "env": {
              "WEBUI_AUTH": "False",
              "WEBUI_NAME": "Nosana Chat"
            },
            "image": "ghcr.io/open-webui/open-webui:ollama",
            "gpu": true,
            "expose": 8080
          }
        }
      ]
    },
    "category": ["AI", "LLM", "GPU", "Service"],
    "icon": "https://openwebui.com/user.png",
    "readme": "# Open WebUI\n\n![Open WebUI](/img/examples/openwebui.gif)\n\nOpen WebUI is an extensible, feature-rich, and user-friendly self-hosted WebUI designed to operate entirely offline. It supports various LLM runners, including Ollama and OpenAI-compatible APIs. With Nosana we can run an instance of Open WebUI and connect to it via a Nosana Endpoint.\n"
  },
  {
    "id": "stable-diffusion",
    "name": "Stable Diffusion",
    "description": "Stable Diffusion is a latent text-to-image diffusion model",
    "template": {
      "version": "0.1",
      "type": "container",
      "meta": {
        "trigger": "cli"
      },
      "ops": [
        {
          "type": "container/run",
          "id": "stable-webui",
          "args": {
            "cmd": [],
            "image": "docker.io/universonic/stable-diffusion-webui:minimal",
            "gpu": true,
            "expose": 8080
          }
        }
      ]
    },
    "category": ["AI", "Image Generation", "GPU", "Service", "Featured"],
    "icon": "https://res.cloudinary.com/dsht8f3ff/image/upload/v1714833633/stabilityai_fiujad.png",
    "readme": "# Stable Diffusion WebUI\n\n![Stable Diffusion WebUI](/img/examples/stable_diff.gif)\n\n[Stable Diffusion WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui) is a web interface for Stable Diffusion, implemented using Gradio library.\n\nUnleash your creativity with Nosana! Effortlessly run a Stable Diffusion instance to generate stunning images.\nExperience the power of advanced AI and GPU-backed nodes, making your image creation process smooth and efficient.\nWhether for personal projects or professional work, Nosana provides the tools you need to bring your artistic visions to life.\n"
  },
]

const templates: Ref<Template[]> = ref(defaultTemplates);

export const useTemplates = () => {
  return { templates, emptyJobDefinition };
};
