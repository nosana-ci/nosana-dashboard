![duckdb-nsql model](https://github.com/ollama/ollama/assets/3325447/b9217c78-0803-45fe-90cf-00bd76705a37)

DuckDB-NSQL is a 7 billion parameter text-to-SQL model designed specifically for SQL generation tasks.

This model is based on Meta’s original Llama-2 7B model and further pre-trained on a dataset of general SQL queries and then fine-tuned on a dataset composed of DuckDB text-to-SQL pairs.

## Usage

### Example Prompt

```
Provided this schema:

CREATE TABLE taxi (
    VendorID bigint,
    tpep_pickup_datetime timestamp,
    tpep_dropoff_datetime timestamp,
    passenger_count double,
    trip_distance double,
    fare_amount double,
    extra double,
    tip_amount double,
    tolls_amount double,
    improvement_surcharge double,
    total_amount double,
);

Give me taxis with more than 2 passengers
```

### Example output

```
SELECT * FROM taxi WHERE passenger_count > 2
```

## Setting the system prompt

This model expects the schema in the system prompt as input:

```
/set system &#34;&#34;&#34;Here is the database schema that the SQL query will run on:
CREATE TABLE taxi (
    VendorID bigint,
    tpep_pickup_datetime timestamp,
    tpep_dropoff_datetime timestamp,
    passenger_count double,
    trip_distance double,
    fare_amount double,
    extra double,
    tip_amount double,
    tolls_amount double,
    improvement_surcharge double,
    total_amount double,
);&#34;&#34;&#34;
```

Once the schema is provided in the system prompt, the model will use it in subsequent responses.

For the following prompt:

```
get all columns ending with _amount from taxi table
```

The model will output something like this:

```
SELECT COLUMNS('.*_amount') FROM taxi;
```

## API example

```
$ curl http://localhost:11434/api/generate -d '{
    &#34;model&#34;: &#34;duckdb-nsql:7b-q4_0&#34;,
    &#34;system&#34;: &#34;Here is the database schema that the SQL query will run on: CREATE TABLE taxi (VendorID bigint, tpep_pickup_datetime timestamp, tpep_dropoff_datetime timestamp, passenger_count double, trip_distance double, fare_amount double, extra double, tip_amount double, tolls_amount double, improvement_surcharge double, total_amount double,);&#34;,
    &#34;prompt&#34;: &#34;get all columns ending with _amount from taxi table&#34;
}'
```

## Python library example

```
pip install ollama
```

```
import ollama

r = ollama.generate(
    model='duckdb-nsql:7b-q4_0',
    system='''Here is the database schema that the SQL query will run on:
CREATE TABLE taxi (
    VendorID bigint,
    tpep_pickup_datetime timestamp,
    tpep_dropoff_datetime timestamp,
    passenger_count double,
    trip_distance double,
    fare_amount double,
    extra double,
    tip_amount double,
    tolls_amount double,
    improvement_surcharge double,
    total_amount double,
);''',
    prompt='get all columns ending with _amount from taxi table',
)

print(r['response'])
```

## Training Data

200k DuckDB text-to-SQL pairs, synthetically generated using Mixtral-8x7B-Instruct-v0.1, guided by the DuckDB v0.9.2 documentation. And text-to-SQL pairs from NSText2SQL that were transpiled to DuckDB SQL using sqlglot.

## Training Procedure

DuckDB-NSQL was trained using cross-entropy loss to maximize the likelihood of sequential inputs. For finetuning on text-to-SQL pairs, we only compute the loss over the SQL portion of the pair. The model is trained using 80GB A100s, leveraging data and model parallelism. We fine-tuned for 10 epochs.

## Intended Use and Limitations

The model was designed for text-to-SQL generation tasks from given table schema and natural language prompts. The model works best with the prompt format defined below and outputs. In contrast to existing text-to-SQL models, the SQL generation is not contrained to SELECT statements, but can generate any valid DuckDB SQL statement, including statements for official DuckDB extensions.

## References

[Hugging Face](https://huggingface.co/motherduckdb/DuckDB-NSQL-7B-v0.1)
