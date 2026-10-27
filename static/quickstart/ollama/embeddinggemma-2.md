**EmbeddingGemma 2** is an open multimodal embedding model built by Google DeepMind which maps text (incl. code), images, video, and audio inputs—and combinations thereof—into a single, unified 768-dimensional vector space. The model has 740M total parameters, combining a 270M parameter text model with modular vision (170M) and audio (300M) encoders.

Designed to run on consumer hardware such as mobile devices and laptops, EmbeddingGemma 2 delivers low-latency semantic representations for on-device applications, like search, retrieval-augmented generation (RAG), classification, and clustering.

EmbeddingGemma 2 builds upon the architectural and capability advancements of Gemma 4, offering several core features:&nbsp;

- **Native multimodality:** Native multimodality: Unifies 4 modalities (text, images, video, and audio) in a single shared 768-dimensional embedding space.
- **Multilinguality and code:** EmbeddingGemma 2 understands 100+ languages, and achieves a ~14% improvement on code tasks relative to its predecessor.&nbsp;
- **Flexible footprint:** Combines a 270M parameter text backbone (130M transformer + 140M embedder) with selectively loadable vision (170M) and audio (300M) encoders, allowing developers to load only the modalities required for their use case.
- **Matryoshka Representation Learning (MRL):** Native support for truncated embeddings across 128d, 256d, 512d, and 768d, enabling up to a **6x reduction** in vector storage costs with minimal impact on quality.
- **Context length:** 8K token context window, capable of processing minutes of audio or video.
- **Task-steered representations:** Uses lightweight text instruction prefixes to optimize embeddings for different tasks (search, classification, clustering, semantic similarity, etc.).

### Model Overview

| Parameters | Total | 740M |
| --- | --- | --- |
|  | **Backbone** | 130M |
|  | **Embedder** | 140M |
|  | **Modality Encoders** | *Vision:* 170M *Audio:* 300M |
| **Architecture** | **Layers** | 24 |
|  | **Model Dimension** | 512 |
|  | **Hidden Dimension** | 2048 |
|  | **Sliding Window** | 1024 tokens |
|  | **Vocabulary Size** | 262,144 |
|  | **# Heads** | 4 |
|  | **# KV-Heads (Local/Global)** | 2⁄1 |
|  | **Local:Global** | 5:1 |
|  | **Attention** | GQA/MQA |
|  | **Activation** | Gated FFN with GELU |
|  | **Pooling** | Mean Pooling |
|  | **Projection Layer** | 512→768 |
| **Input/Output** | **Supported Modalities** | Text, Images, Video, Audio |
|  | **Context Window** | 8,192 tokens |
|  | **Native Output Dimension** | 768 |
|  | **MRL Truncation Dimensions** | 128, 256, 512 |

## **Benchmark Results**

EmbeddingGemma 2 was evaluated across text, code, vision, visual document, video, and audio embedding benchmarks. All results reported below use the full-precision checkpoint.

### Overall Evaluation Results (768d)

| Modality | Benchmark | Metric | EmbeddingGemma 2 | EmbeddingGemma 1 |
| --- | --- | --- | --- | --- |
| *Text* | Massive Text Embedding Benchmark (MTEB, multilingual, v2) | Mean(Task), Multiple | 61.36 | 61.15 |
|  | Massive Text Embedding Benchmark (MTEB, code, v1) | Mean(Task), NDCG@10 | 78.68 | 68.76 |
| *Image* | Massive Image Embedding Benchmark (MIEB, lite) | Mean(TaskType), Multiple | 64.64 | - |
|  | Massive Multimodal Embedding Benchmark (MMEB v2 - Image) | Mean(Task), Hit@1 | 57.28 | - |
|  | Massive Multimodal Embedding Benchmark (MMEB v2 - VisDoc) | Mean(Task), NDCG@5 | 67.84 | - |
| *Video* | Massive Multimodal Embedding Benchmark (MMEB v2 - Video) | Mean(Task), Hit@1 | 50.67 | - |
| *Audio* | Massive Sound Embedding Benchmark (MSEB, Retrieval) | Mean(Task), MRR@10 | 69.54 | - |
|  | Massive Audio Embedding Benchmark (MAEB) *Hugging Face*&nbsp; | Mean(Task), Multiple | 49.39 | - |

### Evaluation Results with Vector Truncation

With MRL, EmbeddingGemma 2 representations can be truncated below the native 768d to 128d, 256d, and 512d representations and re-normalized. With this, model users can reduce storage requirements, with minimal quality impact down to 256d. 128d is best suited to text-only workloads.

| Output Dimension | Compression Ratio | MTEB *(multilingual, v2) Mean(Task)* | MTEB *(eng, v2) Mean(Task)* | MTEB *(code, v1) Mean(Task)* | MIEB *(lite) Mean(TaskType)* | MMEB (v2) *Overall* | MSEB *(Retrieval) Mean(Task)* | MAEB *Mean(Task)* |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 768d (Full) | 1:1 | 61.36 | 68.46 | 78.68 | 64.64 | 59.01 | 69.54 | 49.39 |
| 512d | 1:1.5 | 61.17 | 68.41 | 77.24 | 64.32 | 58.38 | 69.18 | 49.21 |
| 256d | 1:3 | 60.41 | 67.78 | 76.18 | 63.13 | 56.24 | 66.76 | 48.91 |
| 128d | 1:6 | 57.89 | 65.68 | 71.41 | 59.06 | 45.65 | 56.71 | 46.92 |
