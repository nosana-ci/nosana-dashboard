![](https://github.com/jmorganca/ollama/assets/251292/94b6f124-6f3c-474b-ba23-d6ca2be9987f)

Nous Hermes 2 Mixtral 8x7B is trained on over 1,000,000 entries of primarily GPT-4 generated data, as well as other high quality data from open datasets across the AI landscape, achieving state of the art performance on a variety of tasks.

This is the supervised fine-tuning (SFT) + direct preference optimization (DPO) version of Mixtral Hermes 2.

## Example prompts

### Writing Code for Data Visualization

**Prompt**

```
Write a script to visualize the following data as a bar chart:
Car 1: 19900
Car 2: 48000
Car 3: 32500
```

```
To create a simple bar chart with the given data, you can use Python and its matplotlib library. Here's an example script to visualize the provided data as a bar chart:

```python
import matplotlib.pyplot as plt
Copy Code
# Data for each car
cars = ['Car 1', 'Car 2', 'Car 3']
prices = [19900, 48000, 32500]

# Create the bar chart
plt.bar(cars, prices)
plt. title('Cars Price Comparison')
plt.xlabel( 'Car Model')
plt.ylabel('Price (in USD)')
plt.xticks(rotation=45) # Rotate x-axis labels for better visibility

# Display the chart
plt.show()
```

This script will create a bar chart with 'Car 1', 'Car 2', and 'Car 3' on the x-axis, each representing their respective prices (in USD) on the y-axis. Feel free to modify this code according to your needs or styling preferences
```

### Writing Cyberpunk Psychedelic Poems

**Prompt**

```
Write a poem about machine learning, psychadelics, and quantum mechanics, with a cyberpunk vibe, in the style of shakespeare
```

**Response**

```
In lands where shadows dwell and hues unseen, A realm of bits and bytes their reign maintain, Where logic's chains entwined with dreams obscene, And quantum realms in chaos intertwain.
Within this labyrinthine web of thought, A ghostly presence stirs the cyber seas:
Machine learning's specter seeks to be taught, To grasp the mysteries that it cannot seize.
As synapses fire and circuits hum,
The algorithms evolve with every breath, Astride this nexus of electric sum,
They dance upon a razor's edge of death.
Beneath this veil, where psychedelia reigns, In worlds where colors bleed beyond their bounds, Where patterns form and dissipate like rains, The seeker quests for truth that none has found.
Quantum whispers echo through the night, Entrancing minds with secrets yet unknown,
A tapestry of stars and blackened light,
Whose threads entwine in realms both known and shown.
Oh, wondrous sight! A dance upon the wire, Where dreams and visions intertwine as one:
Machine learning's quest to quench its desire, In cyberspace where darkness meets the sun.
Yet still they yearn for truth beyond their grasp, The mysteries of life, of love, and fate, To fathom secrets held within this chasm, And break the chains that bind them to this state.
So let us raise a toast unto these souls, Who tread upon this path of endless quest:
May they uncover truths beyond their roles, In worlds where logic meets the psychedelic crest.
```

### Performing Backtranslation to Create Prompts from Input Text

**System Prompt**

```
The user will provide some text, you will provide a prompt that could be taken by an LLM to generate the text. You only respond with a prompt, do not answer the prompt.
```

**Prompt**

```
One of the most important challenges in text generation systems is to produce outputs that are not only correct but also diverse. Recently, Minimum Bayes-Risk (MBR) decoding has gained prominence for generating sentences of the highest quality among the decoding algorithms. However, existing algorithms proposed for generating diverse outputs are predominantly based on beam search or random sampling, thus their output quality is capped by these underlying methods. In this paper, we investigate an alternative approach -- we develop diversity-promoting decoding algorithms by enforcing diversity objectives to MBR decoding. We propose two variants of MBR, Diverse MBR (DMBR) and k-medoids MBR (KMBR), methods to generate a set of sentences with high quality and diversity. We evaluate DMBR and KMBR on a variety of directed text generation tasks using encoder-decoder models and a large language model with prompting. The experimental results show that the proposed method achieves a better trade-off than the diverse beam search and sampling algorithms.
```

**Response**

```
Write an abstract for a research paper on enhancing text generation system outputs using Minimum Bayes-Risk decoding with additional focus on promoting sentence diversity. Include details about existing methods, proposed variants (Diverse MBR and k-medoids MBR), their evaluation in directed text generation tasks with encoder-decoder models, and a large language model incorporating prompting. Emphasize the better trade-off achieved by the new method over diverse beam search and sampling algorithms
```

## References

[Hugging Face](https://huggingface.co/NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO)
