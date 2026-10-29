![image.png](https://ollama.com/assets/library/ornith/fd32d921-16eb-4fc1-a71b-65124dd4abb7)

Highlights:

- **State-of-the-Art Coding Agents**: Achieving state-of-the-art performance among open-source models of comparable size on coding benchmarks such as Terminal-Bench 2.1, SWE-Bench, NL2Repo and OpenClaw.
- **Self-Improving Training Framework**: Ornith-1.0 employs RL to learn to generate not only solution rollouts, but also the scallfold that drive those rollouts. By jointly optimizing the scaffold and the resulting solution, the model discovers better search trajectories and generates higher-quality solutions.
- **Licence**: MIT licensed, globally accessible, and free from regional limitations.

### 9B

```
ollama run ornith:9b
```

![ornith 9b benchmarks](https://ollama.com/assets/library/ornith/afc40753-0b00-4683-87b4-2c4a12f74acc)

### 35B

```
ollama run ornith:35b
```

![ornith 35b benchmarks](https://ollama.com/assets/library/ornith/b194b793-a9b5-4609-8625-6fabea9a1d19)

## References

- [Blog](https://deep-reinforce.com/ornith_1_0.html)
