
## Docker Usage

### Building the Docker Image

To build the Docker image for the Nosana Dashboard, run:

```bash
docker build -t nosana-dashboard:latest .
```

### Running the Docker Container

To run the container locally, use:

```bash
docker run -p 3000:3000 nosana-dashboard:latest
```

### Publishing the Docker Image

1. Tag the image:

    ```bash
    docker tag nosana-dashboard:latest your-dockerhub-username/nosana-dashboard:latest
    ```

2. Push the image to Docker Hub (or your preferred registry):

    ```bash
    docker push your-dockerhub-username/nosana-dashboard:latest
    ```
