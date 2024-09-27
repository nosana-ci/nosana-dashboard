import type { JobDefinition } from "@nosana/sdk"

const initialJobDefinition: JobDefinition = {
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
}
export { initialJobDefinition }; 
