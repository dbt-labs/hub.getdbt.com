select *
from {{ source("my_source", "my_seed") }}
