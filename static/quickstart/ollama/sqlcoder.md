![](https://docs.defog.ai/img/logo.svg)

SQLCoder is a 15B parameter model that is fine-tuned on a base StarCoder model. It slightly outperforms gpt-3.5-turbo for natural language to SQL generation tasks on the sql-eval framework, and outperforms popular open-source models. It also significantly outperforms text-davinci-003, a model that’s more than 10 times its size.

This 15B completion model generally requires at least 16GB of RAM.

## Usage

### CLI

```
ollama run sqlcoder
```

Try the following prompt using triple quotes for multi-line input:

Note: change the {question} to a SQL question you want to answer. Ex.) ‘which products generate the most sales.`

```
&#34;&#34;&#34; 
### Instructions:
Your task is to convert a question into a SQL query, given a Postgres database schema.
Adhere to these rules:
- **Deliberately go through the question and database schema word by word** to appropriately answer the question
- **Use Table Aliases** to prevent ambiguity. For example, `SELECT table1.col1, table2.col1 FROM table1 JOIN table2 ON table1.id = table2.id`.
- When creating a ratio, always cast the numerator as float

### Input:
Generate a SQL query that answers the question `{question}`.
This query will run on a database whose schema is represented in this string:
CREATE TABLE products (
  product_id INTEGER PRIMARY KEY, -- Unique ID for each product
  name VARCHAR(50), -- Name of the product
  price DECIMAL(10,2), -- Price of each unit of the product
  quantity INTEGER  -- Current quantity in stock
);

CREATE TABLE customers (
   customer_id INTEGER PRIMARY KEY, -- Unique ID for each customer
   name VARCHAR(50), -- Name of the customer
   address VARCHAR(100) -- Mailing address of the customer
);

CREATE TABLE salespeople (
  salesperson_id INTEGER PRIMARY KEY, -- Unique ID for each salesperson
  name VARCHAR(50), -- Name of the salesperson
  region VARCHAR(50) -- Geographic sales region
);

CREATE TABLE sales (
  sale_id INTEGER PRIMARY KEY, -- Unique ID for each sale
  product_id INTEGER, -- ID of product sold
  customer_id INTEGER,  -- ID of customer who made purchase
  salesperson_id INTEGER, -- ID of salesperson who made the sale
  sale_date DATE, -- Date the sale occurred
  quantity INTEGER -- Quantity of product sold
);

CREATE TABLE product_suppliers (
  supplier_id INTEGER PRIMARY KEY, -- Unique ID for each supplier
  product_id INTEGER, -- Product ID supplied
  supply_price DECIMAL(10,2) -- Unit price charged by supplier
);

-- sales.product_id can be joined with products.product_id
-- sales.customer_id can be joined with customers.customer_id
-- sales.salesperson_id can be joined with salespeople.salesperson_id
-- product_suppliers.product_id can be joined with products.product_id

### Response:
Based on your instructions, here is the SQL query I have generated to answer the question `{question}`:
```sql
&#34;&#34;&#34;
```

**Example output:**

```
SELECT customers.customer_id,
       products.product_id,
       (SUM(sales.quantity * product_suppliers.supply_price)) / (SELECT 
SUM(quantity)
                                                                FROM sales
                                                                WHERE 
sales.salesperson_id = '{chosen_salesperson}') as profit
FROM   sales
  INNER JOIN customers on sales.customer_id = customers.customer_id
  INNER JOIN products on sales.product_id = products.product_id
  INNER JOIN product_suppliers on products.product_id = 
product_suppliers.product_id
WHERE  sales.salesperson_id = '{chosen_salesperson}'
GROUP BY customers.customer_id, products.product_id
HAVING COUNT(DISTINCT sales.sale_date) >= {min_days}
  AND (SELECT SUM(quantity * product_suppliers.supply_price)
     FROM   sales
     WHERE  sales.salesperson_id = '{chosen_salesperson}'
        and sales.customer_id = customers.customer_id
        and sales.product_id = products.product_id) >= {min_total}
ORDER BY profit DESC;
```


### Reasoning

The query is broken down into two parts: the first one fetches information
about each sale made by a specific salesman (`{chosen_salesperson}`), and 
groups it by customer ID, product ID, and calculates how much money was 
earned from each sale. The second part then filters out these results that
occurred after a certain number of days (determined by the variable 
`min_days`) and had an amount of money equal to or more than a certain 
value (determined by the variable `min_total`). Finally, the query orders 
the results in descending order based on the ratio between earned money 
and total money.

The first part relies on several tables from the database: salespeople, 
products, customers, sales, and product_suppliers. The salespeople table 
contains information about each salesperson's ID; the products table 
contains information about each product's name and price; the customers 
table contains information about each customer's address; the sales table 
contains information about each sale, including the quantity sold, the ID 
of the product sold, and the ID of the customer who made the purchase; and
the product_suppliers table contains information about the unit price 
charged by each supplier.

The variables in the query can be interpreted as follows:

- `{chosen_salesperson}` is a placeholder for the name of the salesman 
whose performance is being evaluated. This value should be replaced with 
an actual salesman's name or ID number.
- `min_days` is the minimum number of days that must have passed since the
sale in order to qualify for inclusion in the calculation. For example, if
this variable were set to 30, then only sales made 30 days after the start
date would be included in the calculation. This value should also be 
replaced with an integer representing the minimum number of days.
- `min_total` is a threshold amount that must have been earned by the 
salesman for the sale to qualify for inclusion in the calculation. For 
example, if this variable were set to 1000, then only sales worth at least
$1000 would be included in the calculation. This value should also be 
replaced with an integer representing the minimum amount of money that 
must have been earned.

The output is a table containing three columns: customer ID, product ID, 
and profit per unit price (calculated as the total money earned divided by
the quantity sold). The rows in this table are sorted in descending order 
based on the ratio between earned money and total money. Rows that don't 
meet both of these conditions will be dropped from the output.

## Example

```
Input:
min_days = 30
min_total = 1000
chosen_salesperson = '<NAME>'

Output:
  customer_id | product_id |         profit
-------------+----------------------------+-----------------
  987         |     456    | 2.1             
  1029        |    1357    | 1.91            
  89          |    1234    | 0.59            
```

## License

The database is released under the [Open Database 
License](https://opendatacommons.org/licenses/odbl/1-0/).
```

## References

[Hugging Face](https://huggingface.co/defog/sqlcoder)
