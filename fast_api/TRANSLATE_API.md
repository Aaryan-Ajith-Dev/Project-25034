# Translation API Documentation

## Overview
The translation API has been integrated into the FastAPI application and provides Google Cloud Translation v3 functionality.

## Endpoint
`POST /api/translate`

## Authentication
The translate endpoint is publicly accessible and does not require authentication.

## Request Format
```json
{
    "src": "en",  // Optional: source language code (defaults to "en")
    "tgt": "es",  // Required: target language code
    "texts": [    // Required: array of texts to translate
        "Hello world",
        "How are you?"
    ]
}
```

## Response Format
```json
{
    "translations": [
        "Hola mundo",
        "¿Cómo estás?"
    ]
}
```

## Setup Requirements

### Environment Variables
Set one of the following:
- `GOOGLE_CLOUD_PROJECT` - Your Google Cloud project ID
- `GCP_PROJECT` - Alternative project ID variable

### Authentication
Configure Google Cloud authentication by either:
1. Setting `GOOGLE_APPLICATION_CREDENTIALS` to path of service account JSON file
2. Running `gcloud auth application-default login` for Application Default Credentials

### Dependencies
Install required packages:
```bash
pip install -r requirements.txt
```

## Usage Example

### Python
```python
import requests

response = requests.post("http://localhost:8000/api/translate", json={
    "src": "en",
    "tgt": "fr",
    "texts": ["Hello", "Goodbye"]
})

result = response.json()
print(result["translations"])  # ["Bonjour", "Au revoir"]
```

### JavaScript
```javascript
const response = await fetch("http://localhost:8000/api/translate", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify({
        src: "en",
        tgt: "de",
        texts: ["Good morning", "Good night"]
    })
});

const data = await response.json();
console.log(data.translations); // ["Guten Morgen", "Gute Nacht"]
```

## Error Handling
- `400 Bad Request` - Missing required fields (tgt, texts)
- `500 Internal Server Error` - Translation service error or configuration issues

## Language Codes
Use ISO 639-1 language codes:
- `en` - English
- `es` - Spanish
- `fr` - French
- `de` - German
- `it` - Italian
- `pt` - Portuguese
- `ja` - Japanese
- `ko` - Korean
- `zh` - Chinese
- And many more...