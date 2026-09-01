import concurrent.futures
import json
import os
import re
import sys
from pathlib import Path

import requests

if len(sys.argv) != 3:
    raise SystemExit("Usage: generate-natural-examples.py <compare-json> <output-json>")

source = json.loads(Path(sys.argv[1]).read_text())
items = [item for item in source.get("additions", []) if item.get("example", "").startswith("Let's learn ")]
base_url = os.environ["OPENAI_API_BASE"].rstrip("/")
if not base_url.endswith("/v1"):
    base_url += "/v1"
headers = {"Authorization": f"Bearer {os.environ['OPENAI_API_KEY']}", "Content-Type": "application/json"}

def limit_for(level):
    return 12 if level in {"L1", "L2"} else 15 if level in {"L3", "L4"} else 18

def make_request(batch):
    brief = [{"id": item["normalized"], "word": item["word"], "meaning": item["meaning"], "level": item["levelId"], "theme": item["sourceUnit"]} for item in batch]
    prompt = (
        "Create one child-friendly, natural English example sentence for every item below. "
        "The sentence must contain the exact target word or phrase, be understandable for the listed Chinese school grade, and match the theme when possible. "
        "Use simple daily-life situations and Bunny only when natural. Do not explain, translate, list words, use quotation marks, or write generic 'Let's learn' sentences. "
        "Finish each sentence with . ! or ?. Respect these limits: L1/L2 <=12 words, L3/L4 <=15 words, L5/L7 <=18 words.\n"
        + json.dumps(brief, ensure_ascii=False)
    )
    schema = {
        "type": "json_schema",
        "json_schema": {
            "name": "natural_examples",
            "strict": True,
            "schema": {
                "type": "object",
                "properties": {"items": {"type": "array", "items": {"type": "object", "properties": {"id": {"type": "string"}, "example": {"type": "string"}}, "required": ["id", "example"], "additionalProperties": False}}},
                "required": ["items"],
                "additionalProperties": False,
            },
        },
    }
    response = requests.post(
        f"{base_url}/chat/completions",
        headers=headers,
        json={"model": "gpt-5-mini", "messages": [{"role": "system", "content": "You write concise, age-appropriate English learning examples."}, {"role": "user", "content": prompt}], "response_format": schema, "max_completion_tokens": 2200},
        timeout=90,
    )
    response.raise_for_status()
    content = response.json()["choices"][0]["message"]["content"]
    result = json.loads(content)["items"]
    received = {item["id"]: item["example"].strip() for item in result}
    validated = {}
    for item in batch:
        example = received.get(item["normalized"], "")
        word = item["word"].strip().lower()
        word_count = len(re.findall(r"[A-Za-z]+", example))
        if word and word in example.lower() and 2 <= word_count <= limit_for(item["levelId"]) and "let's learn" not in example.lower():
            validated[item["normalized"]] = example if example[-1:] in ".!?" else f"{example}."
    return validated

batches = [items[index:index + 20] for index in range(0, len(items), 20)]
examples = {}
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
    futures = [executor.submit(make_request, batch) for batch in batches]
    for future in concurrent.futures.as_completed(futures):
        examples.update(future.result())

Path(sys.argv[2]).write_text(json.dumps({"expected": len(items), "generated": len(examples), "examples": examples}, ensure_ascii=False, indent=2))
